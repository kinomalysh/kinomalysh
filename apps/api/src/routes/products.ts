import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import { asc, desc, eq, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { productScenes, products, settings } from '@kidsstory/db'
import { deleteObject, isStorageConfigured, presignGet } from '@kidsstory/storage'
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

async function sceneDto(scene: typeof productScenes.$inferSelect) {
  let clipUrl = scene.clipUrl
  let voUrl: string | null = null
  if (isStorageConfigured && scene.clipKey) {
    clipUrl = await presignGet(scene.clipKey, { expiresIn: 3600 }).catch(() => scene.clipUrl)
  }
  if (isStorageConfigured && scene.voKey) {
    voUrl = await presignGet(scene.voKey, { expiresIn: 3600 }).catch(() => null)
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
    clipUrl,
    voUrl,
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
    const [updated] = await db
      .update(products)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()
    if (!updated) return reply.code(404).send({ error: 'Продукт не найден' })
    return { ok: true }
  })

  app.delete('/admin/products/:id', async (req) => {
    const { id } = req.params as { id: string }
    const scenes = await db.select().from(productScenes).where(eq(productScenes.productId, id))
    if (isStorageConfigured) {
      await Promise.all(
        scenes.flatMap((s) =>
          [s.clipKey, s.voKey]
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
    const [updated] = await db
      .update(productScenes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(productScenes.id, id))
      .returning()
    if (!updated) return reply.code(404).send({ error: 'Сцена не найдена' })
    return { scene: await sceneDto(updated) }
  })

  app.delete('/admin/scenes/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const scene = await db.query.productScenes.findFirst({ where: eq(productScenes.id, id) })
    if (!scene) return reply.code(404).send({ error: 'Сцена не найдена' })
    if (isStorageConfigured) {
      await Promise.all(
        [scene.clipKey, scene.voKey]
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
      .set({ ...patch, failReason: null, updatedAt: new Date() })
      .where(eq(productScenes.id, id))
    await sceneQueue.add('scene', { sceneId: id, target: body.target })
    return { ok: true }
  })

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
