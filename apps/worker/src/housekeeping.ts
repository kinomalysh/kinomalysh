import { rm } from 'node:fs/promises'
import path from 'node:path'
import { and, eq, isNotNull, isNull, lt } from 'drizzle-orm'
import { createDb, emailOtps, refreshTokens, stories } from '@kidsstory/db'
import { photoPurgeCutoff } from '@kidsstory/shared'
import { deleteObject, isStorageConfigured } from '@kidsstory/storage'
import { env } from './env.js'

type Db = ReturnType<typeof createDb>

export interface HousekeepingReport {
  photosPurged: number
  resultsExpired: number
  tokensPruned: number
  otpsPruned: number
}

async function purgePhotos(db: Db, now: Date): Promise<number> {
  const cutoff = photoPurgeCutoff(now)
  const rows = await db
    .select({ id: stories.id, photoPath: stories.photoPath })
    .from(stories)
    .where(
      and(
        isNotNull(stories.photoPath),
        isNull(stories.photoPurgedAt),
        lt(stories.createdAt, cutoff),
      ),
    )
    .limit(500)

  let purged = 0
  for (const row of rows) {
    if (!row.photoPath) continue
    await rm(path.join(env.UPLOADS_DIR, row.photoPath), { force: true }).catch((error) => {
      console.warn(`[housekeeping] не удалось стереть фото ${row.photoPath}: ${String(error)}`)
    })
    await db
      .update(stories)
      .set({ photoPurgedAt: now, updatedAt: now })
      .where(eq(stories.id, row.id))
    purged += 1
  }
  return purged
}

async function expireResults(db: Db, now: Date): Promise<number> {
  const rows = await db
    .select({ id: stories.id, resultKey: stories.resultKey })
    .from(stories)
    .where(and(eq(stories.status, 'ready'), isNotNull(stories.resultKey), lt(stories.expiresAt, now)))
    .limit(200)

  let expired = 0
  for (const row of rows) {
    if (isStorageConfigured && row.resultKey) {
      await deleteObject(row.resultKey).catch((error) => {
        console.warn(`[housekeeping] не удалось стереть ${row.resultKey}: ${String(error)}`)
      })
    }
    await db
      .update(stories)
      .set({ status: 'expired', resultKey: null, resultUrl: null, updatedAt: now })
      .where(eq(stories.id, row.id))
    expired += 1
  }
  return expired
}

export async function runHousekeeping(db: Db, now = new Date()): Promise<HousekeepingReport> {
  const photosPurged = await purgePhotos(db, now)
  const resultsExpired = await expireResults(db, now)
  const prunedTokens = await db
    .delete(refreshTokens)
    .where(lt(refreshTokens.expiresAt, now))
    .returning({ id: refreshTokens.id })
  const prunedOtps = await db
    .delete(emailOtps)
    .where(lt(emailOtps.expiresAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)))
    .returning({ id: emailOtps.id })

  return {
    photosPurged,
    resultsExpired,
    tokensPruned: prunedTokens.length,
    otpsPruned: prunedOtps.length,
  }
}
