import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { and, desc, eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { products, stories } from '@kidsstory/db'
import {
  chooseAvatarSchema,
  getPlotDef,
  storyDetailsSchema,
  storyPrice,
} from '@kidsstory/shared'
import { castingQueue, db, productOrderQueue, renderQueue } from '../context.js'
import { env } from '../env.js'
import { holdTokens, InsufficientBalanceError } from '../lib/tokens.js'
import { isStorageConfigured, presignGet } from '@kidsstory/storage'
import { eq as eqOp } from 'drizzle-orm'

const productOrderQuery = z.object({
  childName: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[А-Яа-яЁёA-Za-z-]+$/, 'только буквы и дефис'),
  gender: z.enum(['male', 'female']).default('male'),
})

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function storyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.post('/stories', async (req, reply) => {
    const saved = await savePhoto(req, reply)
    if (!saved) return

    const [story] = await db
      .insert(stories)
      .values({ userId: req.userId, status: 'casting', photoPath: saved })
      .returning()

    await castingQueue.add('casting', { storyId: story.id })
    return reply.code(201).send({ story: await toDto(story) })
  })

  app.post('/stories/product/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const parsed = productOrderQuery.safeParse(req.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Укажите имя ребёнка' })
    }
    const product = await db.query.products.findFirst({ where: eqOp(products.slug, slug) })
    if (!product || product.status !== 'active') {
      return reply.code(404).send({ error: 'Мультик не найден' })
    }

    const saved = await savePhoto(req, reply)
    if (!saved) return

    const [story] = await db
      .insert(stories)
      .values({
        userId: req.userId,
        status: 'awaiting_payment',
        photoPath: saved,
        productId: product.id,
        childName: parsed.data.childName,
        gender: parsed.data.gender,
        tokensCost: product.priceTokens,
      })
      .returning()
    return reply.code(201).send({ story: await toDto(story) })
  })

  app.get('/stories', async (req) => {
    const rows = await db.query.stories.findMany({
      where: eq(stories.userId, req.userId),
      orderBy: desc(stories.createdAt),
    })
    return { stories: await Promise.all(rows.map(toDto)) }
  })

  app.get('/stories/:id', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    return { story: await toDto(story) }
  })

  app.post('/stories/:id/avatar', async (req, reply) => {
    const body = chooseAvatarSchema.parse(req.body)
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    if (story.status !== 'awaiting_choice') {
      return reply.code(409).send({ error: 'Кастинг ещё не готов' })
    }
    if (body.avatarIndex >= story.avatars.length) {
      return reply.code(400).send({ error: 'Такого варианта нет' })
    }

    const [updated] = await db
      .update(stories)
      .set({ chosenAvatar: body.avatarIndex, status: 'awaiting_details', updatedAt: new Date() })
      .where(eq(stories.id, story.id))
      .returning()
    return { story: await toDto(updated) }
  })

  app.post('/stories/:id/recast', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    if (story.status !== 'awaiting_choice') {
      return reply.code(409).send({ error: 'Перегенерация доступна после кастинга' })
    }
    await db
      .update(stories)
      .set({ status: 'casting', avatars: [], updatedAt: new Date() })
      .where(eq(stories.id, story.id))
    await castingQueue.add('casting', { storyId: story.id })
    return { ok: true }
  })

  app.post('/stories/:id/details', async (req, reply) => {
    const body = storyDetailsSchema.parse(req.body)
    const plot = getPlotDef(body.plotId)
    if (!plot) return reply.code(400).send({ error: 'Неизвестный сюжет' })

    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    if (story.status !== 'awaiting_details') {
      return reply.code(409).send({ error: 'Сначала выберите героя' })
    }

    const cost = storyPrice(body.format, plot.premium)
    const [updated] = await db
      .update(stories)
      .set({
        plotId: body.plotId,
        childName: body.childName,
        childAge: body.childAge,
        gender: body.gender,
        format: body.format,
        tokensCost: cost,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, story.id))
      .returning()
    return { story: await toDto(updated) }
  })

  app.post('/stories/:id/pay', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    const isProductOrder = Boolean(story.productId)
    if (isProductOrder) {
      if (story.status !== 'awaiting_payment' || !story.tokensCost) {
        return reply.code(409).send({ error: 'Заказ уже оплачен или не готов к оплате' })
      }
    } else if (story.status !== 'awaiting_details' || !story.tokensCost || !story.plotId) {
      return reply.code(409).send({ error: 'Сначала заполните детали сказки' })
    }

    try {
      await holdTokens(db, req.userId, story.tokensCost, { storyId: story.id })
    } catch (error) {
      if (error instanceof InsufficientBalanceError) {
        return reply.code(402).send({ error: 'Недостаточно токенов — пополните баланс' })
      }
      throw error
    }

    const [updated] = await db
      .update(stories)
      .set({ status: 'rendering', updatedAt: new Date() })
      .where(eq(stories.id, story.id))
      .returning()
    if (isProductOrder) {
      await productOrderQueue.add(
        'product-order',
        { storyId: story.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 30000 } },
      )
    } else {
      await renderQueue.add('render', { storyId: story.id })
    }
    return { story: await toDto(updated) }
  })
}

async function savePhoto(req: FastifyRequest, reply: FastifyReply): Promise<string | null> {
  const file = await req.file({ limits: { fileSize: MAX_PHOTO_BYTES } })
  if (!file) {
    reply.code(400).send({ error: 'Приложите фото ребёнка' })
    return null
  }
  if (!PHOTO_TYPES.has(file.mimetype)) {
    reply.code(400).send({ error: 'Поддерживаются JPG, PNG или WebP' })
    return null
  }
  const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'
  const relPath = path.join('photos', `${randomUUID()}.${ext}`)
  const absPath = path.join(env.UPLOADS_DIR, relPath)
  await mkdir(path.dirname(absPath), { recursive: true })
  await pipeline(file.file, createWriteStream(absPath))
  if (file.file.truncated) {
    reply.code(400).send({ error: 'Файл больше 10 МБ' })
    return null
  }
  return relPath
}

async function findOwn(userId: string, id: string) {
  return db.query.stories.findFirst({
    where: and(eq(stories.id, id), eq(stories.userId, userId)),
  })
}

async function toDto(story: typeof stories.$inferSelect) {
  let resultUrl = story.resultUrl
  if (isStorageConfigured && story.resultKey) {
    resultUrl = await presignGet(story.resultKey, { expiresIn: 3600 }).catch(() => story.resultUrl)
  }
  return {
    id: story.id,
    status: story.status,
    productId: story.productId,
    failReason: story.failReason,
    plotId: story.plotId,
    childName: story.childName,
    childAge: story.childAge,
    gender: story.gender,
    format: story.format,
    tokensCost: story.tokensCost,
    avatars: story.avatars,
    chosenAvatar: story.chosenAvatar,
    scenes: story.scenes,
    resultUrl,
    createdAt: story.createdAt.toISOString(),
  }
}
