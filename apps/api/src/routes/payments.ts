import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { payments, webhookEvents } from '@kidsstory/db'
import { casheraWebhookSchema, getPack, PACKS, topupSchema } from '@kidsstory/shared'
import { db } from '../context.js'
import {
  CasheraError,
  createCasheraPayment,
  FAIL_STATUSES,
  SUCCESS_STATUSES,
  verifyWebhookAuth,
} from '../lib/cashera.js'
import { creditTokens } from '../lib/tokens.js'

export async function paymentRoutes(app: FastifyInstance) {
  app.get('/payments/packs', async () => ({ packs: PACKS }))

  app.post('/payments/topup', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = topupSchema.parse(req.body)
    const pack = getPack(body.packId)
    if (!pack) return reply.code(400).send({ error: 'Неизвестный пакет' })

    const [payment] = await db
      .insert(payments)
      .values({
        userId: req.userId,
        packId: pack.id,
        amountMinor: pack.rub * 100,
        tokens: pack.tokens,
        status: 'pending',
      })
      .returning()

    try {
      const tx = await createCasheraPayment({
        amountMinor: payment.amountMinor,
        externalId: payment.id,
        description: `Киномалыш · ${pack.label}`,
      })
      const [updated] = await db
        .update(payments)
        .set({ casheraUuid: tx.uuid, paymentUrl: tx.payment_url ?? null, updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
        .returning()
      return reply.code(201).send({
        paymentId: updated.id,
        paymentUrl: updated.paymentUrl,
        status: updated.status,
      })
    } catch (error) {
      await db
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
      if (error instanceof CasheraError) {
        req.log.error({ status: error.status, body: error.body }, 'cashera create failed')
        return reply.code(502).send({ error: 'Платёжный сервис недоступен, попробуйте позже' })
      }
      throw error
    }
  })

  app.get('/payments/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, (req.params as { id: string }).id),
    })
    if (!payment || payment.userId !== req.userId) {
      return reply.code(404).send({ error: 'Платёж не найден' })
    }
    return { id: payment.id, status: payment.status, tokens: payment.tokens }
  })

  app.post('/payments/cashera/webhook', async (req, reply) => {
    if (!verifyWebhookAuth(req.headers['x-api-key'], req.headers['x-secret'])) {
      return reply.code(401).send({ error: 'unauthorized' })
    }

    const parsed = casheraWebhookSchema.safeParse(req.body)
    if (!parsed.success) return reply.code(200).send({ ok: true })

    const raw = parsed.data
    const payload = { ...(raw.data ?? {}), ...raw } as Record<string, unknown>
    const uuid = typeof payload.uuid === 'string' ? payload.uuid : null
    const externalId = typeof payload.external_id === 'string' ? payload.external_id : null
    const status = typeof payload.status === 'string' ? payload.status.toLowerCase() : null

    if (!uuid || !status || !externalId) return reply.code(200).send({ ok: true })

    const inserted = await db
      .insert(webhookEvents)
      .values({ eventUuid: uuid, status })
      .onConflictDoNothing()
      .returning()
    if (inserted.length === 0) return reply.code(200).send({ ok: true, duplicate: true })

    const payment = await db.query.payments.findFirst({ where: eq(payments.id, externalId) })
    if (!payment) {
      req.log.warn({ externalId }, 'webhook for unknown payment')
      return reply.code(200).send({ ok: true })
    }

    if (SUCCESS_STATUSES.has(status) && !payment.credited) {
      await db
        .update(payments)
        .set({ status: 'succeeded', credited: true, updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
      await creditTokens(db, payment.userId, payment.tokens, { paymentId: payment.id })
      req.log.info({ paymentId: payment.id, tokens: payment.tokens }, 'payment credited')
    } else if (FAIL_STATUSES.has(status) && payment.status === 'pending') {
      await db
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
    }

    return reply.code(200).send({ ok: true })
  })
}
