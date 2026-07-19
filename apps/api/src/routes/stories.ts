import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { and, desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { stories } from '@kidsstory/db'
import {
  chooseAvatarSchema,
  getPlotDef,
  storyDetailsSchema,
  storyPrice,
} from '@kidsstory/shared'
import { castingQueue, db, renderQueue } from '../context.js'
import { env } from '../env.js'
import { holdTokens, InsufficientBalanceError } from '../lib/tokens.js'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function storyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.post('/stories', async (req, reply) => {
    const file = await req.file({ limits: { fileSize: MAX_PHOTO_BYTES } })
    if (!file) return reply.code(400).send({ error: 'Приложите фото ребёнка' })
    if (!PHOTO_TYPES.has(file.mimetype)) {
      return reply.code(400).send({ error: 'Поддерживаются JPG, PNG или WebP' })
    }

    const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'
    const relPath = path.join('photos', `${randomUUID()}.${ext}`)
    const absPath = path.join(env.UPLOADS_DIR, relPath)
    await mkdir(path.dirname(absPath), { recursive: true })
    await pipeline(file.file, createWriteStream(absPath))
    if (file.file.truncated) return reply.code(400).send({ error: 'Файл больше 10 МБ' })

    const [story] = await db
      .insert(stories)
      .values({ userId: req.userId, status: 'casting', photoPath: relPath })
      .returning()

    await castingQueue.add('casting', { storyId: story.id })
    return reply.code(201).send({ story: toDto(story) })
  })

  app.get('/stories', async (req) => {
    const rows = await db.query.stories.findMany({
      where: eq(stories.userId, req.userId),
      orderBy: desc(stories.createdAt),
    })
    return { stories: rows.map(toDto) }
  })

  app.get('/stories/:id', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    return { story: toDto(story) }
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
    return { story: toDto(updated) }
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
    return { story: toDto(updated) }
  })

  app.post('/stories/:id/pay', async (req, reply) => {
    const story = await findOwn(req.userId, (req.params as { id: string }).id)
    if (!story) return reply.code(404).send({ error: 'Сказка не найдена' })
    if (story.status !== 'awaiting_details' || !story.tokensCost || !story.plotId) {
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
    await renderQueue.add('render', { storyId: story.id })
    return { story: toDto(updated) }
  })
}

async function findOwn(userId: string, id: string) {
  return db.query.stories.findFirst({
    where: and(eq(stories.id, id), eq(stories.userId, userId)),
  })
}

function toDto(story: typeof stories.$inferSelect) {
  return {
    id: story.id,
    status: story.status,
    plotId: story.plotId,
    childName: story.childName,
    childAge: story.childAge,
    gender: story.gender,
    format: story.format,
    tokensCost: story.tokensCost,
    avatars: story.avatars,
    chosenAvatar: story.chosenAvatar,
    scenes: story.scenes,
    resultUrl: story.resultUrl,
    createdAt: story.createdAt.toISOString(),
  }
}
