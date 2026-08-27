import { Queue, UnrecoverableError, Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { and, eq, ne, sql } from 'drizzle-orm'
import { adReels, createDb, productScenes, settings, stories, tokenLedger, users } from '@kidsstory/db'
import {
  buildProductScenePrompt,
  getPlotDef,
  hasNamePlaceholder,
  renderVoiceoverText,
  QUEUE_ADREEL,
  QUEUE_CASTING,
  QUEUE_HOUSEKEEPING,
  QUEUE_RENDER,
  QUEUE_PRODUCT_ORDER,
  QUEUE_SCENE,
  REEL_NEGATIVE_PROMPT,
} from '@kidsstory/shared'
import type {
  AdReelJobData,
  CastingJobData,
  HousekeepingJobData,
  ProductOrderJobData,
  RenderJobData,
  SceneAssetJobData,
} from '@kidsstory/shared'
import { isStorageConfigured, uploadObject } from '@kidsstory/storage'
import { env } from './env.js'
import {
  animateFromText,
  animateScene,
  buildReelFirstFrame,
  ContentPolicyError,
  downloadBytes,
  generateAvatars,
  generateScene,
  photoDataUri,
} from './fal.js'
import { runHousekeeping } from './housekeeping.js'
import { assembleProductOrder, OrderFailedError } from './productOrder.js'
import { generateVoiceover } from './elevenlabs.js'

const SAMPLE_CHILD_NAME = 'Тёма'

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

    try {
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
        negativePrompt: REEL_NEGATIVE_PROMPT,
      })

      let resultKey: string | null = null
      if (isStorageConfigured) {
        try {
          console.log(`[adreel] ${reel.id}: uploading to S3`)
          const bytes = await downloadBytes(videoUrl)
          resultKey = `reels/${reel.id}.mp4`
          await uploadObject(resultKey, bytes, 'video/mp4')
        } catch (error) {
          resultKey = null
          console.error(`[adreel] ${reel.id}: S3 upload failed, keeping fal url — ${String(error)}`)
        }
      }

      await setReelStatus(reel.id, { status: 'ready', resultUrl: videoUrl, resultKey })
      console.log(`[adreel] ${reel.id}: ready`)
    } catch (error) {
      if (error instanceof ContentPolicyError) job.discard()
      throw error
    }
  },
  { connection, concurrency: 4 },
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
      let text = scene.voiceoverText
      if (hasNamePlaceholder(text)) {
        const sample = await db.query.settings.findFirst({
          where: eq(settings.key, 'sample_child_name'),
        })
        text = renderVoiceoverText(text, sample?.value?.trim() || SAMPLE_CHILD_NAME, 'male')
        console.log(`[scene] ${scene.id}: озвучка с тестовым именем`)
      }
      const audio = await generateVoiceover(text)
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
    await setSceneStatus(scene.id, {
      clipStatus: scene.kind === 'hero' ? 'framing' : 'animating',
      frameUrl: null,
      failReason: null,
    })

    let videoUrl: string
    if (scene.kind === 'hero') {
      const sample = await db.query.settings.findFirst({
        where: eq(settings.key, 'sample_child_photo'),
      })
      if (!sample?.value) throw new Error('загрузите тестовое фото ребёнка в настройках')
      console.log(`[scene] ${scene.id}: building frame`)
      const frame = await buildReelFirstFrame([sample.value], fullPrompt, 'landscape_16_9')
      await setSceneStatus(scene.id, { clipStatus: 'animating', frameUrl: frame })
      console.log(`[scene] ${scene.id}: animating`)
      videoUrl = await animateScene(frame, scene.motionPrompt?.trim() || fullPrompt, {
        negativePrompt: REEL_NEGATIVE_PROMPT,
      })
    } else {
      console.log(`[scene] ${scene.id}: text-to-video`)
      videoUrl = await animateFromText(fullPrompt, {
        aspectRatio: '16:9',
        negativePrompt: REEL_NEGATIVE_PROMPT,
      })
    }

    let clipKey: string | null = null
    if (isStorageConfigured) {
      clipKey = `products/${scene.productId}/${scene.id}.mp4`
      await uploadObject(clipKey, await downloadBytes(videoUrl), 'video/mp4')
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

const productOrderWorker = new Worker<ProductOrderJobData>(
  QUEUE_PRODUCT_ORDER,
  async (job) => {
    console.log(`[order] ${job.data.storyId}: сборка запущена`)
    try {
      await assembleProductOrder(db, job.data.storyId)
    } catch (error) {
      if (error instanceof ContentPolicyError || error instanceof OrderFailedError) {
        throw new UnrecoverableError(error.message)
      }
      throw error
    }
  },
  { connection, concurrency: 1 },
)

productOrderWorker.on('failed', async (job, error) => {
  console.error(`[order] failed: ${error.message}`)
  if (!job) return
  const willRetry =
    !(error instanceof UnrecoverableError) && job.attemptsMade < (job.opts.attempts ?? 1)
  if (willRetry) return

  const [changed] = await db
    .update(stories)
    .set({ status: 'failed', failReason: error.message, updatedAt: new Date() })
    .where(and(eq(stories.id, job.data.storyId), ne(stories.status, 'failed')))
    .returning()
  if (!changed) return

  await refundStory(job.data.storyId)
  console.log(`[order] ${job.data.storyId}: заказ провален, токены возвращены`)
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

const housekeepingQueue = new Queue<HousekeepingJobData>(QUEUE_HOUSEKEEPING, { connection })

const housekeepingWorker = new Worker<HousekeepingJobData>(
  QUEUE_HOUSEKEEPING,
  async () => {
    const report = await runHousekeeping(db)
    console.log(
      `[housekeeping] фото удалено ${report.photosPurged}, результатов просрочено ${report.resultsExpired}, ` +
        `сессий ${report.tokensPruned}, кодов ${report.otpsPruned}`,
    )
  },
  { connection, concurrency: 1 },
)

housekeepingWorker.on('failed', (_job, error) => {
  console.error(`[housekeeping] failed: ${error.message}`)
})

await housekeepingQueue.upsertJobScheduler(
  'hourly-housekeeping',
  { every: 60 * 60 * 1000 },
  { name: 'housekeeping', data: { reason: 'scheduled' } },
)

console.log('[worker] listening for casting, render, adreel, scene, product-order and housekeeping jobs')

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await Promise.all([
      castingWorker.close(),
      renderWorker.close(),
      adReelWorker.close(),
      sceneWorker.close(),
      productOrderWorker.close(),
      housekeepingWorker.close(),
    ])
    process.exit(0)
  })
}
