import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { productScenes, products, stories, storyScenes } from '@kidsstory/db'
import {
  chooseAvatarSchema,
  CONSENT_VERSION,
  daysLeft,
  getPlotDef,
  storyDetailsSchema,
  storyPrice,
} from '@kidsstory/shared'
import { isStorageConfigured, presignGet } from '@kidsstory/storage'
import { castingQueue, db, productOrderQueue, renderQueue } from '../context.js'
import { env } from '../env.js'
import { holdTokens, InsufficientBalanceError } from '../lib/tokens.js'

const consentFlag = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1')

const productOrderQuery = z.object({
  childName: z
    .string()
    .trim()
    .min(1)
    .max(30)
    .regex(/^[А-Яа-яЁёA-Za-z-]+$/, 'только буквы и дефис'),
  gender: z.enum(['male', 'female']).default('male'),
  consentGuardian: consentFlag,
  consentTransfer: consentFlag,
})

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type Story = typeof stories.$inferSelect

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
      return reply.code(400).send({ error: 'Проверьте имя ребёнка и согласия' })
    }
    if (!parsed.data.consentGuardian || !parsed.data.consentTransfer) {
      return reply.code(400).send({ error: 'Без обоих согласий заказ оформить нельзя' })
    }
    const product = await db.query.products.findFirst({ where: eq(products.slug, slug) })
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
        consentVersion: CONSENT_VERSION,
        consentAt: new Date(),
      })
      .returning()
    return reply.code(201).send({ story: await toDto(story) })
  })

  app.get('/stories', async (req) => {
    const rows = await db.query.stories.findMany({
      where: eq(stories.userId, req.userId),
      orderBy: desc(stories.createdAt),
    })
    return { stories: await Promise.all(rows.map((row) => toDto(row))) }
  })

  app.get('/stories/:id', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    return { story: await toDto(story) }
  })

  app.delete('/stories/:id', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    if (story.status === 'rendering') {
      return reply.code(409).send({ error: 'Мультик ещё собирается - дождитесь готовности' })
    }
    await purgePhotoFile(story.photoPath)
    await db.delete(stories).where(eq(stories.id, story.id))
    return { ok: true }
  })

  app.get('/stories/:id/download', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    if (story.status !== 'ready' || !story.resultKey || !isStorageConfigured) {
      return reply.code(409).send({ error: 'Файл ещё не готов' })
    }
    const name = story.childName ? `kinomalysh-${translit(story.childName)}.mp4` : 'kinomalysh.mp4'
    const url = await presignGet(story.resultKey, { expiresIn: 600, downloadFilename: name })
    return { url }
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
    if (story.photoPurgedAt) {
      return reply
        .code(409)
        .send({ error: 'Фото удалено по сроку хранения - оформите заказ заново' })
    }
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
        return reply.code(402).send({ error: 'Недостаточно токенов - пополните баланс' })
      }
      throw error
    }

    const [updated] = await db
      .update(stories)
      .set({ status: 'rendering', failReason: null, updatedAt: new Date() })
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
    await rm(absPath, { force: true }).catch(() => undefined)
    reply.code(400).send({ error: 'Файл больше 10 МБ' })
    return null
  }
  return relPath
}

async function purgePhotoFile(photoPath: string | null): Promise<void> {
  if (!photoPath) return
  await rm(path.join(env.UPLOADS_DIR, photoPath), { force: true }).catch(() => undefined)
}

async function findOwn(userId: string, id: string) {
  return db.query.stories.findFirst({
    where: and(eq(stories.id, id), eq(stories.userId, userId)),
  })
}

export interface OrderProgress {
  stage: 'awaiting_payment' | 'queued' | 'rendering' | 'assembling' | 'ready' | 'failed' | 'expired'
  done: number
  total: number
  percent: number
}

async function buildProgress(story: Story): Promise<OrderProgress | null> {
  if (!story.productId) return null
  if (story.status === 'awaiting_payment') {
    return { stage: 'awaiting_payment', done: 0, total: 0, percent: 0 }
  }
  if (story.status === 'ready') return { stage: 'ready', done: 1, total: 1, percent: 100 }
  if (story.status === 'failed') return { stage: 'failed', done: 0, total: 0, percent: 0 }
  if (story.status === 'expired') return { stage: 'expired', done: 0, total: 0, percent: 100 }

  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(productScenes)
    .where(and(eq(productScenes.productId, story.productId), eq(productScenes.kind, 'hero')))
  const [doneRow] = await db
    .select({ done: sql<number>`count(*)::int` })
    .from(storyScenes)
    .where(and(eq(storyScenes.storyId, story.id), eq(storyScenes.status, 'ready')))

  const total = totalRow?.total ?? 0
  const done = Math.min(doneRow?.done ?? 0, total)
  const stage = total > 0 && done >= total ? 'assembling' : done > 0 ? 'rendering' : 'queued'
  const percent = total === 0 ? 5 : Math.min(95, Math.round((done / total) * 90) + 5)
  return { stage, done, total, percent }
}

async function toDto(story: Story) {
  let resultUrl = story.resultUrl
  if (isStorageConfigured && story.resultKey && story.status === 'ready') {
    resultUrl = await presignGet(story.resultKey, { expiresIn: 3600 }).catch(() => story.resultUrl)
  }
  let product: { slug: string; title: string } | null = null
  if (story.productId) {
    const row = await db.query.products.findFirst({ where: eq(products.id, story.productId) })
    product = row ? { slug: row.slug, title: row.title } : null
  }
  return {
    id: story.id,
    status: story.status,
    productId: story.productId,
    product,
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
    progress: await buildProgress(story),
    expiresAt: story.expiresAt?.toISOString() ?? null,
    daysLeft: story.expiresAt ? daysLeft(story.expiresAt, new Date()) : null,
    photoPurged: Boolean(story.photoPurgedAt),
    createdAt: story.createdAt.toISOString(),
  }
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

function translit(value: string): string {
  return (
    value
      .toLowerCase()
      .split('')
      .map((char) => TRANSLIT[char] ?? (/[a-z0-9-]/.test(char) ? char : ''))
      .join('') || 'malysh'
  )
}
