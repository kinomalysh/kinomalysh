import { createDb } from '@kidsstory/db'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import { QUEUE_ADREEL, QUEUE_CASTING, QUEUE_RENDER } from '@kidsstory/shared'
import type { AdReelJobData, CastingJobData, RenderJobData } from '@kidsstory/shared'
import { env } from './env.js'

export const db = createDb(env.DATABASE_URL)

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })

export const castingQueue = new Queue<CastingJobData>(QUEUE_CASTING, { connection: redis })
export const renderQueue = new Queue<RenderJobData>(QUEUE_RENDER, { connection: redis })
export const adReelQueue = new Queue<AdReelJobData>(QUEUE_ADREEL, { connection: redis })
