import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { eq, sql } from 'drizzle-orm'
import { createDb, stories, tokenLedger, users } from '@kidsstory/db'
import { getPlotDef, QUEUE_CASTING, QUEUE_RENDER } from '@kidsstory/shared'
import type { CastingJobData, RenderJobData } from '@kidsstory/shared'
import { env } from './env.js'
import { generateAvatars, generateScene } from './fal.js'

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
    console.log(`[render] story ${story.id}: generating ${plot.scenePrompts.length} scenes`)

    const scenes: string[] = []
    for (const prompt of plot.scenePrompts) {
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

console.log('[worker] listening for casting and render jobs')

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await Promise.all([castingWorker.close(), renderWorker.close()])
    process.exit(0)
  })
}
