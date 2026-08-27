import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { and, asc, eq } from 'drizzle-orm'
import { createDb, productScenes, products, stories, storyScenes } from '@kidsstory/db'
import {
  buildProductScenePrompt,
  hasNamePlaceholder,
  INTRO_CLIP_KEY,
  REEL_NEGATIVE_PROMPT,
  renderVoiceoverText,
  resultExpiryFrom,
} from '@kidsstory/shared'
import type { ChildGender } from '@kidsstory/shared'
import { getObject, isStorageConfigured, uploadObject } from '@kidsstory/storage'
import { animateScene, buildReelFirstFrame, ContentPolicyError, downloadBytes } from './fal.js'
import { generateVoiceover } from './elevenlabs.js'
import { buildSegment, concatSegments, normalizeIntro } from './ffmpeg.js'

type Db = ReturnType<typeof createDb>
type Scene = typeof productScenes.$inferSelect

const SCENE_ATTEMPTS = 3

export class OrderFailedError extends Error {
  constructor(
    message: string,
    public readonly permanent: boolean,
  ) {
    super(message)
  }
}

async function withRetries<T>(label: string, attempts: number, task: () => Promise<T>): Promise<T> {
  let last: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      if (error instanceof ContentPolicyError) throw error
      last = error
      console.warn(`[order] ${label}: попытка ${attempt}/${attempts} не удалась — ${String(error)}`)
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 5000 * attempt))
    }
  }
  throw last instanceof Error ? last : new Error(String(last))
}

async function downloadToFile(key: string, dest: string): Promise<void> {
  await writeFile(dest, await getObject(key))
}

function approvedClip(scene: Scene): string {
  if (!scene.approvedClipKey) {
    throw new OrderFailedError(`сцена ${scene.position} не утверждена — сборка невозможна`, true)
  }
  return scene.approvedClipKey
}

function approvedVo(scene: Scene): string | null {
  if (!scene.voiceoverText?.trim()) return null
  if (!scene.approvedVoKey) {
    throw new OrderFailedError(`у сцены ${scene.position} не утверждена озвучка`, true)
  }
  return scene.approvedVoKey
}

async function renderPersonalVo(
  db: Db,
  scene: Scene,
  storyId: string,
  childName: string,
  gender: ChildGender,
): Promise<string> {
  const row = await db.query.storyScenes.findFirst({
    where: and(eq(storyScenes.storyId, storyId), eq(storyScenes.sceneId, scene.id)),
  })
  if (!row) throw new OrderFailedError(`нет строки рендера для сцены ${scene.id}`, true)
  if (row.voKey) return row.voKey

  const voiceoverText =
    gender === 'female' && scene.voiceoverTextFemale?.trim()
      ? scene.voiceoverTextFemale
      : (scene.voiceoverText as string)
  const text = renderVoiceoverText(voiceoverText, childName, gender)
  console.log(`[order] ${storyId}: персональная озвучка сцены ${scene.position}`)
  const audio = await withRetries(`озвучка ${scene.id}`, SCENE_ATTEMPTS, () =>
    generateVoiceover(text),
  )
  const key = `orders/${storyId}/${scene.id}-vo.mp3`
  await uploadObject(key, audio, 'audio/mpeg')
  await db
    .update(storyScenes)
    .set({ voKey: key, updatedAt: new Date() })
    .where(eq(storyScenes.id, row.id))
  return key
}

async function renderHeroClip(
  db: Db,
  scene: Scene,
  storyId: string,
  photoPath: string,
  gender: ChildGender,
): Promise<string> {
  const rowFilter = and(eq(storyScenes.storyId, storyId), eq(storyScenes.sceneId, scene.id))
  const existing = await db.query.storyScenes.findFirst({ where: rowFilter })
  if (!existing) throw new OrderFailedError(`нет строки рендера для сцены ${scene.id}`, true)
  if (existing.status === 'ready' && existing.clipKey) {
    console.log(`[order] ${storyId}: сцена ${scene.position} уже отрисована — пропускаю`)
    return existing.clipKey
  }

  await db
    .update(storyScenes)
    .set({ status: 'rendering', attempts: existing.attempts + 1, updatedAt: new Date() })
    .where(eq(storyScenes.id, existing.id))

  const promptText =
    gender === 'female' && scene.promptFemale?.trim() ? scene.promptFemale : scene.prompt
  const fullPrompt = buildProductScenePrompt(promptText)
  const frame = await withRetries(`кадр ${scene.id}`, SCENE_ATTEMPTS, () =>
    buildReelFirstFrame([photoPath], fullPrompt, 'landscape_16_9'),
  )
  const videoUrl = await withRetries(`оживление ${scene.id}`, SCENE_ATTEMPTS, () =>
    animateScene(frame, scene.motionPrompt?.trim() || fullPrompt, {
      negativePrompt: REEL_NEGATIVE_PROMPT,
    }),
  )

  const key = `orders/${storyId}/${scene.id}.mp4`
  await uploadObject(key, await downloadBytes(videoUrl), 'video/mp4')
  await db
    .update(storyScenes)
    .set({ status: 'ready', clipKey: key, failReason: null, updatedAt: new Date() })
    .where(eq(storyScenes.id, existing.id))
  return key
}

export async function assembleProductOrder(db: Db, storyId: string): Promise<void> {
  if (!isStorageConfigured) throw new OrderFailedError('S3 не настроен — сборка невозможна', true)

  const story = await db.query.stories.findFirst({ where: eq(stories.id, storyId) })
  if (!story) throw new OrderFailedError(`заказ ${storyId} не найден`, true)
  if (!story.productId) throw new OrderFailedError(`у заказа ${storyId} нет продукта`, true)
  if (!story.photoPath) throw new OrderFailedError('к заказу не приложено фото ребёнка', true)
  const childName = story.childName?.trim() ?? ''
  const gender: ChildGender = story.gender === 'female' ? 'female' : 'male'

  const product = await db.query.products.findFirst({ where: eq(products.id, story.productId) })
  if (!product) throw new OrderFailedError('продукт заказа удалён', true)

  const scenes = await db
    .select()
    .from(productScenes)
    .where(eq(productScenes.productId, product.id))
    .orderBy(asc(productScenes.position))
  if (scenes.length === 0) throw new OrderFailedError('у продукта нет сцен', true)
  if (!childName && scenes.some((s) => hasNamePlaceholder(s.voiceoverText))) {
    throw new OrderFailedError('в заказе нет имени ребёнка, а озвучка персональная', true)
  }

  const needsOrderRow = (s: Scene) => s.kind === 'hero' || hasNamePlaceholder(s.voiceoverText)
  for (const scene of scenes.filter(needsOrderRow)) {
    await db
      .insert(storyScenes)
      .values({ storyId, sceneId: scene.id, position: scene.position })
      .onConflictDoNothing()
  }

  const workDir = await mkdtemp(path.join(tmpdir(), `order-${storyId}-`))
  try {
    const introRawPath = path.join(workDir, 'intro-raw.mp4')
    const introPath = path.join(workDir, 'intro-seg.mp4')
    await downloadToFile(INTRO_CLIP_KEY, introRawPath)
    await normalizeIntro(introRawPath, introPath)
    const segments: string[] = [introPath]
    for (const scene of scenes) {
      console.log(`[order] ${storyId}: сцена ${scene.position}/${scenes.length} (${scene.kind})`)
      const clipKey =
        scene.kind === 'hero'
          ? await renderHeroClip(db, scene, storyId, story.photoPath, gender)
          : approvedClip(scene)
      const voKey = hasNamePlaceholder(scene.voiceoverText)
        ? await renderPersonalVo(db, scene, storyId, childName, gender)
        : approvedVo(scene)

      const clipPath = path.join(workDir, `${scene.position}-clip.mp4`)
      await downloadToFile(clipKey, clipPath)
      let voPath: string | null = null
      if (voKey) {
        voPath = path.join(workDir, `${scene.position}-vo.mp3`)
        await downloadToFile(voKey, voPath)
      }

      const segPath = path.join(workDir, `${String(scene.position).padStart(3, '0')}-seg.mp4`)
      await buildSegment(clipPath, voPath, segPath)
      segments.push(segPath)
    }

    console.log(`[order] ${storyId}: склейка ${segments.length} сегментов`)
    const finalPath = path.join(workDir, 'final.mp4')
    await concatSegments(segments, workDir, finalPath)

    const resultKey = `orders/${storyId}/final.mp4`
    await uploadObject(resultKey, new Uint8Array(await readFile(finalPath)), 'video/mp4')
    const readyAt = new Date()
    await db
      .update(stories)
      .set({
        status: 'ready',
        resultKey,
        failReason: null,
        expiresAt: resultExpiryFrom(readyAt),
        updatedAt: readyAt,
      })
      .where(eq(stories.id, storyId))
    console.log(`[order] ${storyId}: готов`)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}
