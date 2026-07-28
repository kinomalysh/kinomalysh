import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import bcrypt from 'bcryptjs'
import { and, count, desc, eq, gte, ilike, or, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { adReels, admins, payments, stories, tokenLedger, users } from '@kidsstory/db'
import { deleteObject, isStorageConfigured, presignGet } from '@kidsstory/storage'
import {
  adjustBalanceSchema,
  adminLoginSchema,
  buildReelPrompt,
  createReelSchema,
  getPlotDef,
  updatePromptsSchema,
} from '@kidsstory/shared'
import { z } from 'zod'
import { adReelQueue, db, renderQueue } from '../context.js'
import { env } from '../env.js'
import { issueAdminTokens, revokeAdminRefresh, rotateAdminRefresh } from '../lib/adminTokens.js'

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const PAGE_SIZE = 30

const refreshSchema = z.object({ refreshToken: z.string().min(1) })
const listQuerySchema = z.object({
  q: z.string().max(120).optional(),
  status: z.string().max(24).optional(),
  page: z.coerce.number().int().min(1).default(1),
})

export async function adminRoutes(app: FastifyInstance) {
  app.post('/admin/auth/login', async (req, reply) => {
    const body = adminLoginSchema.parse(req.body)
    const admin = await db.query.admins.findFirst({ where: eq(admins.login, body.login) })
    const ok = admin && (await bcrypt.compare(body.password, admin.passwordHash))
    if (!admin || !ok) return reply.code(401).send({ error: 'Неверный логин или пароль' })
    const tokens = await issueAdminTokens(app, admin.id)
    return { ...tokens, admin: { id: admin.id, login: admin.login, name: admin.name } }
  })

  app.post('/admin/auth/refresh', async (req, reply) => {
    const body = refreshSchema.parse(req.body)
    const tokens = await rotateAdminRefresh(app, body.refreshToken)
    if (!tokens) return reply.code(401).send({ error: 'Сессия истекла' })
    return tokens
  })

  app.post('/admin/auth/logout', async (req) => {
    const body = refreshSchema.parse(req.body)
    await revokeAdminRefresh(body.refreshToken)
    return { ok: true }
  })

  app.register(protectedAdminRoutes)
}

async function protectedAdminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticateAdmin)

  app.get('/admin/me', async (req) => {
    const admin = await db.query.admins.findFirst({ where: eq(admins.id, req.adminId) })
    return { admin: admin && { id: admin.id, login: admin.login, name: admin.name } }
  })

  app.get('/admin/dashboard', async () => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [[userCount], [storyCount], statusRows, [readyWeek], [revenue], [reelCount]] = await Promise.all([
      db.select({ v: count() }).from(users),
      db.select({ v: count() }).from(stories),
      db.select({ status: stories.status, v: count() }).from(stories).groupBy(stories.status),
      db
        .select({ v: count() })
        .from(stories)
        .where(and(eq(stories.status, 'ready'), gte(stories.createdAt, since))),
      db
        .select({ v: sql<number>`coalesce(sum(${payments.amountMinor}), 0)` })
        .from(payments)
        .where(eq(payments.status, 'succeeded')),
      db.select({ v: count() }).from(adReels),
    ])
    return {
      users: userCount.v,
      stories: storyCount.v,
      readyLastWeek: readyWeek.v,
      revenueMinor: Number(revenue.v),
      reels: reelCount.v,
      byStatus: Object.fromEntries(statusRows.map((r) => [r.status, r.v])),
    }
  })

  app.get('/admin/fal-balance', async (_req, reply) => {
    const key = env.FAL_ADMIN_KEY || env.FAL_KEY
    if (!key) return reply.code(503).send({ error: 'FAL-ключ не задан на сервере' })
    try {
      const res = await fetch('https://api.fal.ai/v1/account/billing?expand=credits', {
        headers: { Authorization: `Key ${key}` },
      })
      const data = (await res.json().catch(() => ({}))) as {
        username?: string
        credits?: { current_balance?: number; currency?: string }
        error?: { message?: string }
      }
      if (!res.ok) {
        const msg = data.error?.message ?? `fal.ai ответил ${res.status}`
        const permission = msg.toLowerCase().includes('not permitted')
        return reply
          .code(502)
          .send({ error: permission ? 'Нужен admin-ключ fal.ai (FAL_ADMIN_KEY)' : msg })
      }
      return {
        username: data.username ?? null,
        balance: data.credits?.current_balance ?? null,
        currency: data.credits?.currency ?? 'USD',
      }
    } catch {
      return reply.code(502).send({ error: 'Не удалось получить баланс fal.ai' })
    }
  })

  app.get('/admin/stories', async (req) => {
    const { q, status, page } = listQuerySchema.parse(req.query)
    const filters = [
      status ? eq(stories.status, status) : undefined,
      q ? ilike(stories.childName, `%${q}%`) : undefined,
    ].filter(Boolean)
    const where = filters.length ? and(...filters) : undefined

    const rows = await db
      .select({
        id: stories.id,
        status: stories.status,
        plotId: stories.plotId,
        childName: stories.childName,
        format: stories.format,
        resultUrl: stories.resultUrl,
        createdAt: stories.createdAt,
        userEmail: users.email,
      })
      .from(stories)
      .leftJoin(users, eq(stories.userId, users.id))
      .where(where)
      .orderBy(desc(stories.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
    const [total] = await db.select({ v: count() }).from(stories).where(where)
    return {
      stories: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      total: total.v,
      page,
      pageSize: PAGE_SIZE,
    }
  })

  app.get('/admin/stories/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const story = await db.query.stories.findFirst({ where: eq(stories.id, id) })
    if (!story) return reply.code(404).send({ error: 'Заказ не найден' })
    const owner = await db.query.users.findFirst({ where: eq(users.id, story.userId) })
    const plot = story.plotId ? getPlotDef(story.plotId) : undefined
    const scenePrompts = story.scenePrompts.length ? story.scenePrompts : (plot?.scenePrompts ?? [])
    return {
      story: {
        ...story,
        scenePrompts,
        promptsFromPlot: story.scenePrompts.length === 0,
        createdAt: story.createdAt.toISOString(),
        updatedAt: story.updatedAt.toISOString(),
        user: owner && { id: owner.id, email: owner.email, name: owner.name },
      },
    }
  })

  app.patch('/admin/stories/:id/prompts', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = updatePromptsSchema.parse(req.body)
    const story = await db.query.stories.findFirst({ where: eq(stories.id, id) })
    if (!story) return reply.code(404).send({ error: 'Заказ не найден' })
    await db
      .update(stories)
      .set({ scenePrompts: body.scenePrompts, updatedAt: new Date() })
      .where(eq(stories.id, id))
    return { ok: true, scenePrompts: body.scenePrompts }
  })

  app.post('/admin/stories/:id/regenerate', async (req, reply) => {
    const { id } = req.params as { id: string }
    const story = await db.query.stories.findFirst({ where: eq(stories.id, id) })
    if (!story) return reply.code(404).send({ error: 'Заказ не найден' })
    if (story.chosenAvatar === null || !story.plotId) {
      return reply.code(409).send({ error: 'Заказ не готов к рендеру: нет героя или сюжета' })
    }
    await db
      .update(stories)
      .set({ status: 'rendering', scenes: [], resultUrl: null, failReason: null, updatedAt: new Date() })
      .where(eq(stories.id, id))
    await renderQueue.add('render', { storyId: id })
    return { ok: true }
  })

  app.get('/admin/users', async (req) => {
    const { q, page } = listQuerySchema.parse(req.query)
    const where = q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)) : undefined
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        balance: users.balance,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
    const [total] = await db.select({ v: count() }).from(users).where(where)
    return {
      users: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
      total: total.v,
      page,
      pageSize: PAGE_SIZE,
    }
  })

  app.get('/admin/users/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const user = await db.query.users.findFirst({ where: eq(users.id, id) })
    if (!user) return reply.code(404).send({ error: 'Пользователь не найден' })
    const ledger = await db
      .select()
      .from(tokenLedger)
      .where(eq(tokenLedger.userId, id))
      .orderBy(desc(tokenLedger.createdAt))
      .limit(50)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      ledger: ledger.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    }
  })

  app.post('/admin/users/:id/balance', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = adjustBalanceSchema.parse(req.body)
    try {
      const balance = await db.transaction(async (tx) => {
        const updated = await tx
          .update(users)
          .set({ balance: sql`${users.balance} + ${body.delta}` })
          .where(sql`${users.id} = ${id} and ${users.balance} + ${body.delta} >= 0`)
          .returning({ balance: users.balance })
        if (updated.length === 0) throw new Error('NEGATIVE_OR_MISSING')
        await tx.insert(tokenLedger).values({ userId: id, delta: body.delta, kind: 'admin' })
        return updated[0].balance
      })
      return { ok: true, balance }
    } catch (error) {
      if (error instanceof Error && error.message === 'NEGATIVE_OR_MISSING') {
        return reply.code(409).send({ error: 'Баланс не может стать отрицательным' })
      }
      throw error
    }
  })

  app.get('/admin/reels', async (req) => {
    const { page } = listQuerySchema.parse(req.query)
    const rows = await db
      .select()
      .from(adReels)
      .orderBy(desc(adReels.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
    const [total] = await db.select({ v: count() }).from(adReels)
    return {
      reels: await Promise.all(rows.map(reelDto)),
      total: total.v,
      page,
      pageSize: PAGE_SIZE,
    }
  })

  app.get('/admin/reels/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const reel = await db.query.adReels.findFirst({ where: eq(adReels.id, id) })
    if (!reel) return reply.code(404).send({ error: 'Ролик не найден' })
    return { reel: await reelDto(reel) }
  })

  app.delete('/admin/reels/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const reel = await db.query.adReels.findFirst({ where: eq(adReels.id, id) })
    if (!reel) return reply.code(404).send({ error: 'Ролик не найден' })

    if (reel.resultKey && isStorageConfigured) {
      await deleteObject(reel.resultKey).catch((error: unknown) => req.log.warn({ error }, 'S3 delete failed'))
    }
    await Promise.all(
      reel.inputPhotos.map((rel) =>
        rm(path.join(env.UPLOADS_DIR, rel), { force: true }).catch(() => undefined),
      ),
    )
    await db.delete(adReels).where(eq(adReels.id, id))
    return { ok: true }
  })

  app.post('/admin/reels', async (req, reply) => {
    const fields: Record<string, string> = {}
    const photos: string[] = []
    for await (const part of req.parts()) {
      if (part.type === 'file') {
        if (!PHOTO_TYPES.has(part.mimetype)) {
          return reply.code(400).send({ error: 'Фото должно быть JPG, PNG или WebP' })
        }
        const ext =
          part.mimetype === 'image/png' ? 'png' : part.mimetype === 'image/webp' ? 'webp' : 'jpg'
        const relPath = path.join('reels', `${randomUUID()}.${ext}`)
        const absPath = path.join(env.UPLOADS_DIR, relPath)
        await mkdir(path.dirname(absPath), { recursive: true })
        await pipeline(part.file, createWriteStream(absPath))
        if (part.file.truncated) return reply.code(400).send({ error: 'Файл больше 12 МБ' })
        photos.push(relPath)
      } else {
        fields[part.fieldname] = part.value as string
      }
    }

    const body = createReelSchema.parse(fields)
    if (photos.length === 0) return reply.code(400).send({ error: 'Приложите хотя бы одно фото' })
    if (body.kind === 'i2v' && photos.length !== 1) {
      return reply.code(400).send({ error: 'Для оживления сцены нужна ровно одна картинка' })
    }

    const fullPrompt = body.kind === 't2v' ? buildReelPrompt(body.scenePrompt) : body.scenePrompt.trim()
    const [reel] = await db
      .insert(adReels)
      .values({
        adminId: req.adminId,
        kind: body.kind,
        title: body.title ?? null,
        scenePrompt: body.scenePrompt,
        fullPrompt,
        motionPrompt: body.motionPrompt ?? null,
        inputPhotos: photos,
        status: 'queued',
      })
      .returning()
    await adReelQueue.add('adreel', { reelId: reel.id })
    return reply.code(201).send({ reel: await reelDto(reel) })
  })
}

async function reelDto(reel: typeof adReels.$inferSelect) {
  let resultUrl = reel.resultUrl
  let downloadUrl = reel.resultUrl
  if (reel.resultKey && isStorageConfigured) {
    try {
      const filename = `${(reel.title ?? 'kinomalysh').replace(/[^\w.-]+/g, '_')}.mp4`
      resultUrl = await presignGet(reel.resultKey, { expiresIn: 3600 })
      downloadUrl = await presignGet(reel.resultKey, { expiresIn: 3600, downloadFilename: filename })
    } catch {
      resultUrl = reel.resultUrl
      downloadUrl = reel.resultUrl
    }
  }
  return {
    id: reel.id,
    kind: reel.kind,
    title: reel.title,
    scenePrompt: reel.scenePrompt,
    fullPrompt: reel.fullPrompt,
    motionPrompt: reel.motionPrompt,
    inputPhotos: reel.inputPhotos,
    firstFrameUrl: reel.firstFrameUrl,
    status: reel.status,
    resultUrl,
    downloadUrl,
    stored: Boolean(reel.resultKey),
    failReason: reel.failReason,
    createdAt: reel.createdAt.toISOString(),
    updatedAt: reel.updatedAt.toISOString(),
  }
}
