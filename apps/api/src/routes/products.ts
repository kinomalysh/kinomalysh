import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { productScenes, products, settings } from '@kidsstory/db'
import { deleteObject, isStorageConfigured, presignGet } from '@kidsstory/storage'
import { hasNamePlaceholder, NAME_PLACEHOLDER_HINT } from '@kidsstory/shared'
import { z } from 'zod'
import { db, sceneQueue } from '../context.js'
import { env } from '../env.js'

const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const SAMPLE_KEY = 'sample_child_photo'

const createProductSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, 'латиница, цифры и дефис'),
  tagline: z.string().max(200).optional(),
})
const patchProductSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  tagline: z.string().max(200).nullable().optional(),
  description: z.string().max(4000).nullable().optional(),
  priceTokens: z.number().int().min(0).max(100000).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
})
const kindSchema = z.enum(['hero', 'library', 'title'])
const addSceneSchema = z.object({
  kind: kindSchema,
  title: z.string().max(120).optional(),
  prompt: z.string().max(4000).optional(),
  voiceoverText: z.string().max(4000).optional(),
})
const patchSceneSchema = z.object({
  kind: kindSchema.optional(),
  title: z.string().max(120).nullable().optional(),
  prompt: z.string().max(4000).optional(),
  voiceoverText: z.string().max(4000).nullable().optional(),
  motionPrompt: z.string().max(2000).nullable().optional(),
})
const reorderSchema = z.object({ orderedIds: z.array(z.string().uuid()).min(1).max(60) })
const generateSchema = z.object({ target: z.enum(['clip', 'vo']) })
const approveSchema = z.object({ approved: z.boolean() })

const ACTIVE_CLIP = new Set(['queued', 'framing', 'animating'])
const ACTIVE_VO = new Set(['queued', 'generating'])

async function publishBlockers(productId: string): Promise<string[]> {
  const scenes = await db
    .select()
    .from(productScenes)
    .where(eq(productScenes.productId, productId))
    .orderBy(asc(productScenes.position))
  if (scenes.length === 0) return ['у продукта нет сцен']

  const blockers: string[] = []
  const noPrompt = scenes.filter((s) => !s.prompt.trim()).map((s) => s.position)
  const noClip = scenes.filter((s) => !s.approvedClipKey).map((s) => s.position)
  const noVo = scenes
    .filter((s) => s.voiceoverText?.trim() && !s.approvedVoKey)
    .map((s) => s.position)
  if (noPrompt.length) blockers.push(`нет промпта у сцен: ${noPrompt.join(', ')}`)
  if (noClip.length) blockers.push(`нет утверждённого клипа у сцен: ${noClip.join(', ')}`)
  if (noVo.length) blockers.push(`нет озвучки у сцен: ${noVo.join(', ')}`)
  const notApproved = scenes.filter((s) => !s.approvedAt).map((s) => s.position)
  if (notApproved.length) blockers.push(`не утверждены сцены: ${notApproved.join(', ')}`)
  return blockers
}

async function sceneDto(scene: typeof productScenes.$inferSelect) {
  let clipUrl = scene.clipUrl
  let voUrl: string | null = null
  let approvedClipUrl: string | null = null
  let approvedVoUrl: string | null = null
  if (isStorageConfigured && scene.clipKey) {
    clipUrl = await presignGet(scene.clipKey, { expiresIn: 3600 }).catch(() => scene.clipUrl)
  }
  if (isStorageConfigured && scene.voKey) {
    voUrl = await presignGet(scene.voKey, { expiresIn: 3600 }).catch(() => null)
  }
  if (isStorageConfigured && scene.approvedClipKey) {
    approvedClipUrl = await presignGet(scene.approvedClipKey, { expiresIn: 3600 }).catch(() => null)
  }
  if (isStorageConfigured && scene.approvedVoKey) {
    approvedVoUrl = await presignGet(scene.approvedVoKey, { expiresIn: 3600 }).catch(() => null)
  }
  return {
    id: scene.id,
    productId: scene.productId,
    position: scene.position,
    kind: scene.kind,
    title: scene.title,
    prompt: scene.prompt,
    voiceoverText: scene.voiceoverText,
    motionPrompt: scene.motionPrompt,
    clipStatus: scene.clipStatus,
    voStatus: scene.voStatus,
    frameUrl: scene.frameUrl,
    clipUrl,
    voUrl,
    updatedAt: scene.updatedAt.toISOString(),
    approvedAt: scene.approvedAt?.toISOString() ?? null,
    personalized: hasNamePlaceholder(scene.voiceoverText),
    approvedClipUrl,
    approvedVoUrl,
    isLatestApproved: Boolean(scene.clipKey) && scene.clipKey === scene.approvedClipKey,
    hasClip: Boolean(scene.clipKey),
    hasVo: Boolean(scene.voKey),
    failReason: scene.failReason,
  }
}

export async function productRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticateAdmin)

  app.get('/admin/products', async () => {
    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        tagline: products.tagline,
        status: products.status,
        updatedAt: products.updatedAt,
        scenes: sql<number>`(select count(*) from ${productScenes} where ${productScenes.productId} = ${products.id})`,
      })
      .from(products)
      .orderBy(desc(products.createdAt))
    return { products: rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() })) }
  })

  app.post('/admin/products', async (req, reply) => {
    const body = createProductSchema.parse(req.body)
    const existing = await db.query.products.findFirst({ where: eq(products.slug, body.slug) })
    if (existing) return reply.code(409).send({ error: 'Продукт с таким slug уже есть' })
    const [product] = await db
      .insert(products)
      .values({ title: body.title, slug: body.slug, tagline: body.tagline ?? null })
      .returning()
    return reply.code(201).send({ product })
  })

  app.get('/admin/products/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const product = await db.query.products.findFirst({ where: eq(products.id, id) })
    if (!product) return reply.code(404).send({ error: 'Продукт не найден' })
    const scenes = await db
      .select()
      .from(productScenes)
      .where(eq(productScenes.productId, id))
      .orderBy(asc(productScenes.position))
    return {
      product: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      scenes: await Promise.all(scenes.map(sceneDto)),
    }
  })

  app.patch('/admin/products/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = patchProductSchema.parse(req.body)
    if (body.status === 'active') {
      const blockers = await publishBlockers(id)
      if (blockers.length) return reply.code(409).send({ error: blockers.join('; ') })
    }
    const [updated] = await db
      .update(products)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    if (!updated) return reply.code(404).send({ error: 'Продукт не найден' })
    return { ok: true }
  })

  app.get('/admin/products/:id/readiness', async (req) => {
    const { id } = req.params as { id: string }
    const blockers = await publishBlockers(id)
    return { canPublish: blockers.length === 0, blockers }
  })

  app.post('/admin/products/:id/masters', async (req) => {
    const { id } = req.params as { id: string }
    const scenes = await db
      .select()
      .from(productScenes)
      .where(eq(productScenes.productId, id))
      .orderBy(asc(productScenes.position))
    let queued = 0
    for (const scene of scenes) {
      if (!scene.clipKey && scene.prompt.trim() && !ACTIVE_CLIP.has(scene.clipStatus)) {
        await db
          .update(productScenes)
          .set({ clipStatus: 'queued', failReason: null, updatedAt: new Date() })
          .where(eq(productScenes.id, scene.id))
        await sceneQueue.add('scene', { sceneId: scene.id, target: 'clip' })
        queued += 1
      }
      if (!scene.voKey && scene.voiceoverText?.trim() && !ACTIVE_VO.has(scene.voStatus)) {
        await db
          .update(productScenes)
          .set({ voStatus: 'queued', failReason: null, updatedAt: new Date() })
          .where(eq(productScenes.id, scene.id))
        await sceneQueue.add('scene', { sceneId: scene.id, target: 'vo' })
        queued += 1
      }
    }
    return { queued }
  })

  app.delete('/admin/products/:id', async (req) => {
    const { id } = req.params as { id: string }
    const scenes = await db.select().from(productScenes).where(eq(productScenes.productId, id))
    if (isStorageConfigured) {
      await Promise.all(
        scenes.flatMap((s) =>
          [s.clipKey, s.voKey, s.approvedClipKey, s.approvedVoKey]
            .filter((k): k is string => Boolean(k))
            .map((k) => deleteObject(k).catch(() => undefined)),
        ),
      )
    }
    await db.delete(products).where(eq(products.id, id))
    return { ok: true }
  })

  app.post('/admin/products/:id/scenes', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = addSceneSchema.parse(req.body)
    const product = await db.query.products.findFirst({ where: eq(products.id, id) })
    if (!product) return reply.code(404).send({ error: 'Продукт не найден' })
    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${productScenes.position}), 0)` })
      .from(productScenes)
      .where(eq(productScenes.productId, id))
    const [scene] = await db
      .insert(productScenes)
      .values({
        productId: id,
        position: Number(max) + 1,
        kind: body.kind,
        title: body.title ?? null,
        prompt: body.prompt ?? '',
        voiceoverText: body.voiceoverText ?? null,
      })
      .returning()
    return reply.code(201).send({ scene: await sceneDto(scene) })
  })

  app.patch('/admin/scenes/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = patchSceneSchema.parse(req.body)
    const current = await db.query.productScenes.findFirst({ where: eq(productScenes.id, id) })
    if (!current) return reply.code(404).send({ error: 'Сцена не найдена' })

    const patch: Partial<typeof productScenes.$inferInsert> = { ...body, updatedAt: new Date() }
    const promptChanged =
      (body.prompt !== undefined && body.prompt !== current.prompt) ||
      (body.motionPrompt !== undefined && body.motionPrompt !== current.motionPrompt) ||
      (body.kind !== undefined && body.kind !== current.kind)
    const voChanged =
      body.voiceoverText !== undefined && body.voiceoverText !== current.voiceoverText

    const staleKeys: string[] = []
    const dropsApproval = (promptChanged || voChanged) && Boolean(current.approvedAt)
    if (promptChanged || voChanged) {
      patch.failReason = null
      patch.approvedAt = null
    }
    if (promptChanged && current.clipKey) {
      if (current.clipKey !== current.approvedClipKey) staleKeys.push(current.clipKey)
      Object.assign(patch, { clipKey: null, clipUrl: null, frameUrl: null, clipStatus: 'idle' })
    }
    if (voChanged && current.voKey) {
      if (current.voKey !== current.approvedVoKey) staleKeys.push(current.voKey)
      Object.assign(patch, { voKey: null, voStatus: 'idle' })
    }
    if (isStorageConfigured && staleKeys.length) {
      await Promise.all(staleKeys.map((k) => deleteObject(k).catch(() => undefined)))
    }

    const [updated] = await db
      .update(productScenes)
      .set(patch)
      .where(eq(productScenes.id, id))
      .returning()

    let unpublished = false
    if (dropsApproval) {
      const [product] = await db
        .update(products)
        .set({ status: 'draft', updatedAt: new Date() })
        .where(and(eq(products.id, current.productId), eq(products.status, 'active')))
        .returning()
      unpublished = Boolean(product)
    }

    return { scene: await sceneDto(updated), invalidated: staleKeys.length > 0, unpublished }
  })

  app.delete('/admin/scenes/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const scene = await db.query.productScenes.findFirst({ where: eq(productScenes.id, id) })
    if (!scene) return reply.code(404).send({ error: 'Сцена не найдена' })
    if (isStorageConfigured) {
      await Promise.all(
        [scene.clipKey, scene.voKey, scene.approvedClipKey, scene.approvedVoKey]
          .filter((k): k is string => Boolean(k))
          .map((k) => deleteObject(k).catch(() => undefined)),
      )
    }
    await db.delete(productScenes).where(eq(productScenes.id, id))
    return { ok: true }
  })

  app.post('/admin/products/:id/scenes/reorder', async (req) => {
    const body = reorderSchema.parse(req.body)
    await db.transaction(async (tx) => {
      for (let i = 0; i < body.orderedIds.length; i += 1) {
        await tx
          .update(productScenes)
          .set({ position: i + 1, updatedAt: new Date() })
          .where(eq(productScenes.id, body.orderedIds[i]))
      }
    })
    return { ok: true }
  })

  app.post('/admin/scenes/:id/generate', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = generateSchema.parse(req.body)
    const scene = await db.query.productScenes.findFirst({ where: eq(productScenes.id, id) })
    if (!scene) return reply.code(404).send({ error: 'Сцена не найдена' })
    if (body.target === 'clip' && !scene.prompt.trim()) {
      return reply.code(400).send({ error: 'Заполните промпт сцены' })
    }
    if (body.target === 'vo' && !scene.voiceoverText?.trim()) {
      return reply.code(400).send({ error: 'Заполните текст озвучки' })
    }
    const patch = body.target === 'clip' ? { clipStatus: 'queued' } : { voStatus: 'queued' }
    await db
      .update(productScenes)
      .set({ ...patch, approvedAt: null, failReason: null, updatedAt: new Date() })
      .where(eq(productScenes.id, id))
    await sceneQueue.add('scene', { sceneId: id, target: body.target })
    return { ok: true }
  })

  app.post('/admin/scenes/:id/approve', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = approveSchema.parse(req.body)
    const scene = await db.query.productScenes.findFirst({ where: eq(productScenes.id, id) })
    if (!scene) return reply.code(404).send({ error: 'Сцена не найдена' })
    if (body.approved && !scene.clipKey) {
      return reply.code(409).send({ error: 'Сначала прогоните сцену — утверждать нечего' })
    }
    if (body.approved && scene.voiceoverText?.trim() && !scene.voKey) {
      return reply.code(409).send({ error: 'Нет озвучки — сгенерируйте её перед утверждением' })
    }
    if (!body.approved) {
      const orphans = [scene.approvedClipKey, scene.approvedVoKey].filter(
        (k): k is string => Boolean(k) && k !== scene.clipKey && k !== scene.voKey,
      )
      if (isStorageConfigured && orphans.length) {
        await Promise.all(orphans.map((k) => deleteObject(k).catch(() => undefined)))
      }
    }

    const [updated] = await db
      .update(productScenes)
      .set({
        approvedAt: body.approved ? new Date() : null,
        approvedClipKey: body.approved ? scene.clipKey : null,
        approvedVoKey: body.approved ? scene.voKey : null,
        updatedAt: new Date(),
      })
      .where(eq(productScenes.id, id))
      .returning()
    return { scene: await sceneDto(updated) }
  })

  app.get('/admin/placeholders', async () => ({ hint: NAME_PLACEHOLDER_HINT }))

  app.get('/admin/settings/sample-child', async () => {
    const row = await db.query.settings.findFirst({ where: eq(settings.key, SAMPLE_KEY) })
    return { hasSample: Boolean(row?.value), url: row ? `/uploads/${row.value}` : null }
  })

  app.post('/admin/settings/sample-child', async (req, reply) => {
    const file = await req.file({ limits: { fileSize: 12 * 1024 * 1024 } })
    if (!file) return reply.code(400).send({ error: 'Приложите фото' })
    if (!PHOTO_TYPES.has(file.mimetype)) {
      return reply.code(400).send({ error: 'JPG, PNG или WebP' })
    }
    const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg'
    const relPath = path.join('sample', `child-${randomUUID()}.${ext}`)
    const absPath = path.join(env.UPLOADS_DIR, relPath)
    await mkdir(path.dirname(absPath), { recursive: true })
    await pipeline(file.file, createWriteStream(absPath))
    if (file.file.truncated) return reply.code(400).send({ error: 'Файл больше 12 МБ' })
    await db
      .insert(settings)
      .values({ key: SAMPLE_KEY, value: relPath })
      .onConflictDoUpdate({ target: settings.key, set: { value: relPath, updatedAt: new Date() } })
    return { ok: true, url: `/uploads/${relPath}` }
  })
}

export async function publicCatalogRoutes(app: FastifyInstance) {
  app.get('/catalog', async () => {
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.status, 'active'))
      .orderBy(asc(products.createdAt))
    return { products: await Promise.all(rows.map(catalogDto)) }
  })

  app.get('/catalog/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    const product = await db.query.products.findFirst({ where: eq(products.slug, slug) })
    if (!product || product.status !== 'active') {
      return reply.code(404).send({ error: 'Мультик не найден' })
    }
    return { product: await catalogDto(product) }
  })
}

async function catalogDto(product: typeof products.$inferSelect) {
  const scenes = await db
    .select()
    .from(productScenes)
    .where(eq(productScenes.productId, product.id))
    .orderBy(asc(productScenes.position))
  const previewSource =
    product.previewKey ?? scenes.find((s) => s.approvedClipKey)?.approvedClipKey ?? null
  let previewUrl: string | null = null
  if (isStorageConfigured && previewSource) {
    previewUrl = await presignGet(previewSource, { expiresIn: 3600 }).catch(() => null)
  }
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    tagline: product.tagline,
    description: product.description,
    priceTokens: product.priceTokens,
    sceneCount: scenes.length,
    previewUrl,
  }
}
