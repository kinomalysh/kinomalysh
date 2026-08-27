import { rm } from 'node:fs/promises'
import path from 'node:path'
import { desc, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { payments, stories, tokenLedger, users } from '@kidsstory/db'
import { deleteObject, isStorageConfigured } from '@kidsstory/storage'
import { db } from '../context.js'
import { env } from '../env.js'

const HISTORY_LIMIT = 50

export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  app.get('/me/ledger', async (req) => {
    const rows = await db.query.tokenLedger.findMany({
      where: eq(tokenLedger.userId, req.userId),
      orderBy: desc(tokenLedger.createdAt),
      limit: HISTORY_LIMIT,
    })
    return {
      entries: rows.map((row) => ({
        id: row.id,
        delta: row.delta,
        kind: row.kind,
        storyId: row.storyId,
        createdAt: row.createdAt.toISOString(),
      })),
    }
  })

  app.get('/me/payments', async (req) => {
    const rows = await db.query.payments.findMany({
      where: eq(payments.userId, req.userId),
      orderBy: desc(payments.createdAt),
      limit: HISTORY_LIMIT,
    })
    return {
      payments: rows.map((row) => ({
        id: row.id,
        packId: row.packId,
        amountRub: Math.round(row.amountMinor / 100),
        tokens: row.tokens,
        status: row.status,
        paymentUrl: row.status === 'pending' ? row.paymentUrl : null,
        createdAt: row.createdAt.toISOString(),
      })),
    }
  })

  app.delete('/me', async (req, reply) => {
    const own = await db.query.stories.findMany({ where: eq(stories.userId, req.userId) })
    const pending = own.find((story) => story.status === 'rendering')
    if (pending) {
      return reply.code(409).send({ error: 'Дождитесь окончания сборки - потом удалим аккаунт' })
    }

    for (const story of own) {
      if (story.photoPath) {
        await rm(path.join(env.UPLOADS_DIR, story.photoPath), { force: true }).catch(
          () => undefined,
        )
      }
      if (isStorageConfigured && story.resultKey) {
        await deleteObject(story.resultKey).catch(() => undefined)
      }
    }

    await db.delete(users).where(eq(users.id, req.userId))
    return { ok: true }
  })
}
