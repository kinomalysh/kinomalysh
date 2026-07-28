import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { eq, sql } from 'drizzle-orm'
import { adReels, createDb, productScenes, settings, stories, tokenLedger, users } from '@kidsstory/db'
import {
  buildProductScenePrompt,
  getPlotDef,
  QUEUE_ADREEL,
  QUEUE_CASTING,
  QUEUE_RENDER,
  QUEUE_SCENE,
  REEL_NEGATIVE_PROMPT,
} from '@kidsstory/shared'
import type { AdReelJobData, CastingJobData, RenderJobData, SceneAssetJobData } from '@kidsstory/shared'
import { isStorageConfigured, uploadObject } from '@kidsstory/storage'
import { env } from './env.js'
import {
  animateFromText,
  animateScene,
  buildReelFirstFrame,
  generateAvatars,
  generateScene,
  photoDataUri,
} from './fal.js'
import { generateVoiceover } from './elevenlabs.js'

const db = createDb(env.DATABASE_URL)
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })

async function setStatus(storyId: string, patch: Partial<typeof stories.$inferInsert>) {
  await db
    .update(stories)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(stories.id, storyId))
}

async function refundStory(storyId: string) {
  const story = await db.query.stories.findFirst({ where: eq(stories.id, storyId) })
  if (!story?.tokensCost) return
  const cost = story.tokensCost
  const userId = story.userId
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${cost}` })
      .where(eq(users.id, userId))
    await tx.insert(tokenLedger).values({
      userId,
      delta: cost,
      kind: 'refund',
      storyId,
    })
  })
}

const castingWorker = new Worker<CastingJobData>(
  QUEUE_CASTING,
  async (job) => {
    const story = await db.query.stories.findFirst({ where: eq(stories.id, job.data.storyId) })
    if (!story?.photoPath) throw new Error(`story ${job.data.storyId} has no photo`)

    console.log(`[casting] story ${story.id}: generating avatars`)
    const avatars = await generateAvatars(story.photoPath, 3)
    await setStatus(story.id, { status: 'awaiting_choice', avatars })
    console.log(`[casting] story ${story.id}: done`)
  },
  { connection, concurrency: 3 },
)

const renderWorker = new Worker<RenderJobData>(
  QUEUE_RENDER,
  async (job) => {
    const story = await db.query.stories.findFirst({ where: eq(stories.id, job.data.storyId) })
    if (!story) throw new Error(`story ${job.data.storyId} not found`)
    const plot = story.plotId ? getPlotDef(story.plotId) : undefined
    if (!plot || story.chosenAvatar === null) {
      throw new Error(`story ${story.id} is not ready for render`)
    }

    const avatarUrl = story.avatars[story.chosenAvatar]
    const scenePrompts = story.scenePrompts.length ? story.scenePrompts : plot.scenePrompts
    console.log(`[render] story ${story.id}: generating ${scenePrompts.length} scenes`)

    const scenes: string[] = []
    for (const prompt of scenePrompts) {
      scenes.push(await generateScene(avatarUrl, prompt))
      await setStatus(story.id, { scenes })
    }

    await setStatus(story.id, {
      status: 'ready',
      scenes,
      resultUrl: scenes[scenes.length - 1] ?? null,
    })
    console.log(`[render] story ${story.id}: ready`)
  },
  { connection, concurrency: 2 },
)

async function setReelStatus(reelId: string, patch: Partial<typeof adReels.$inferInsert>) {
  await db
    .update(adReels)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(adReels.id, reelId))
}

const adReelWorker = new Worker<AdReelJobData>(
  QUEUE_ADREEL,
  async (job) => {
    const reel = await db.query.adReels.findFirst({ where: eq(adReels.id, job.data.reelId) })
    if (!reel) throw new Error(`reel ${job.data.reelId} not found`)
    if (reel.inputPhotos.length === 0) throw new Error(`reel ${reel.id} has no input photos`)

    let sceneImageUrl: string
    if (reel.kind === 't2v') {
      console.log(`[adreel] ${reel.id}: building first frame`)
      await setReelStatus(reel.id, { status: 'framing' })
      sceneImageUrl = await buildReelFirstFrame(reel.inputPhotos, reel.fullPrompt)
      await setReelStatus(reel.id, { firstFrameUrl: sceneImageUrl })
    } else {
      sceneImageUrl = await photoDataUri(reel.inputPhotos[0])
    }

    console.log(`[adreel] ${reel.id}: animating`)
    await setReelStatus(reel.id, { status: 'animating' })
    const motionPrompt = reel.motionPrompt?.trim() || reel.fullPrompt
    const videoUrl = await animateScene(sceneImageUrl, motionPrompt, {
      aspectRatio: '9:16',
      negativePrompt: REEL_NEGATIVE_PROMPT,
    })

    let resultKey: string | null = null
    if (isStorageConfigured) {
      try {
        console.log(`[adreel] ${reel.id}: uploading to S3`)
        const res = await fetch(videoUrl)
        if (!res.ok) throw new Error(`download ${res.status}`)
        const bytes = new Uint8Array(await res.arrayBuffer())
        resultKey = `reels/${reel.id}.mp4`
        await uploadObject(resultKey, bytes, 'video/mp4')
      } catch (error) {
        resultKey = null
        console.error(`[adreel] ${reel.id}: S3 upload failed, keeping fal url — ${String(error)}`)
      }
    }

    await setReelStatus(reel.id, { status: 'ready', resultUrl: videoUrl, resultKey })
    console.log(`[adreel] ${reel.id}: ready`)
  },
  { connection, concurrency: 2 },
)

adReelWorker.on('failed', async (job, error) => {
  console.error(`[adreel] failed: ${error.message}`)
  if (job?.data.reelId && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await setReelStatus(job.data.reelId, { status: 'failed', failReason: error.message })
  }
})

async function setSceneStatus(sceneId: string, patch: Partial<typeof productScenes.$inferInsert>) {
  await db
    .update(productScenes)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(productScenes.id, sceneId))
}

const sceneWorker = new Worker<SceneAssetJobData>(
  QUEUE_SCENE,
  async (job) => {
    const scene = await db.query.productScenes.findFirst({
      where: eq(productScenes.id, job.data.sceneId),
    })
    if (!scene) throw new Error(`scene ${job.data.sceneId} not found`)

    if (job.data.target === 'vo') {
      if (!scene.voiceoverText?.trim()) throw new Error('нет текста озвучки')
      await setSceneStatus(scene.id, { voStatus: 'generating', failReason: null })
      const audio = await generateVoiceover(scene.voiceoverText)
      let voKey: string | null = null
      if (isStorageConfigured) {
        voKey = `products/${scene.productId}/${scene.id}-vo.mp3`
        await uploadObject(voKey, audio, 'audio/mpeg')
      }
      await setSceneStatus(scene.id, { voStatus: 'ready', voKey })
      console.log(`[scene] ${scene.id}: vo ready`)
      return
    }

    if (!scene.prompt.trim()) throw new Error('нет промпта сцены')
    const fullPrompt = buildProductScenePrompt(scene.prompt)
    await setSceneStatus(scene.id, { clipStatus: scene.kind === 'hero' ? 'framing' : 'animating', failReason: null })

    let videoUrl: string
    if (scene.kind === 'hero') {
      const sample = await db.query.settings.findFirst({
        where: eq(settings.key, 'sample_child_photo'),
      })
      if (!sample?.value) throw new Error('загрузите тестовое фото ребёнка в настройках')
      const frame = await buildReelFirstFrame([sample.value], fullPrompt, 'landscape_16_9')
      await setSceneStatus(scene.id, { clipStatus: 'animating' })
      videoUrl = await animateScene(frame, scene.motionPrompt?.trim() || fullPrompt, {
        aspectRatio: '16:9',
        negativePrompt: REEL_NEGATIVE_PROMPT,
      })
    } else {
      videoUrl = await animateFromText(fullPrompt, {
        aspectRatio: '16:9',
        negativePrompt: REEL_NEGATIVE_PROMPT,
      })
    }

    let clipKey: string | null = null
    if (isStorageConfigured) {
      const res = await fetch(videoUrl)
      if (!res.ok) throw new Error(`download ${res.status}`)
      clipKey = `products/${scene.productId}/${scene.id}.mp4`
      await uploadObject(clipKey, new Uint8Array(await res.arrayBuffer()), 'video/mp4')
    }
    await setSceneStatus(scene.id, { clipStatus: 'ready', clipUrl: videoUrl, clipKey })
    console.log(`[scene] ${scene.id}: clip ready`)
  },
  { connection, concurrency: 2 },
)

sceneWorker.on('failed', async (job, error) => {
  console.error(`[scene] failed: ${error.message}`)
  if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    const field = job.data.target === 'vo' ? { voStatus: 'failed' } : { clipStatus: 'failed' }
    await db
      .update(productScenes)
      .set({ ...field, failReason: error.message, updatedAt: new Date() })
      .where(eq(productScenes.id, job.data.sceneId))
  }
})

castingWorker.on('failed', async (job, error) => {
  console.error(`[casting] failed: ${error.message}`)
  if (job?.data.storyId && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await setStatus(job.data.storyId, { status: 'failed', failReason: error.message })
  }
})

renderWorker.on('failed', async (job, error) => {
  console.error(`[render] failed: ${error.message}`)
  if (job?.data.storyId && job.attemptsMade >= (job.opts.attempts ?? 1)) {
    await setStatus(job.data.storyId, { status: 'failed', failReason: error.message })
    await refundStory(job.data.storyId)
  }
})

console.log('[worker] listening for casting, render, adreel and scene jobs')

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await Promise.all([
      castingWorker.close(),
      renderWorker.close(),
      adReelWorker.close(),
      sceneWorker.close(),
    ])
    process.exit(0)
  })
}
