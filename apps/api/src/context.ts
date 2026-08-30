import { createDb } from '@kidsstory/db'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import {
  QUEUE_ADREEL,
  QUEUE_CASTING,
  QUEUE_PRODUCT_ORDER,
  QUEUE_RENDER,
  QUEUE_BOOK_PAGE,
  QUEUE_SCENE,
} from '@kidsstory/shared'
import type {
  AdReelJobData,
  CastingJobData,
  ProductOrderJobData,
  RenderJobData,
  BookPageJobData,
  SceneAssetJobData,
} from '@kidsstory/shared'
import { env } from './env.js'

export const db = createDb(env.DATABASE_URL)

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })

export const rateLimitRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 500,
  lazyConnect: false,
})

rateLimitRedis.on('error', () => {
  /* лимитер деградирует сам, ронять API из-за Redis нельзя */
})

export const castingQueue = new Queue<CastingJobData>(QUEUE_CASTING, { connection: redis })
export const renderQueue = new Queue<RenderJobData>(QUEUE_RENDER, { connection: redis })
export const adReelQueue = new Queue<AdReelJobData>(QUEUE_ADREEL, { connection: redis })
export const sceneQueue = new Queue<SceneAssetJobData>(QUEUE_SCENE, { connection: redis })
export const bookPageQueue = new Queue<BookPageJobData>(QUEUE_BOOK_PAGE, { connection: redis })
export const productOrderQueue = new Queue<ProductOrderJobData>(QUEUE_PRODUCT_ORDER, {
  connection: redis,
})
