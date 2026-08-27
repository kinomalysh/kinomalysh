import { and, eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { payments, webhookEvents } from '@kidsstory/db'
import {
  extractCasheraEvent,
  getPack,
  isTestWebhook,
  PACKS,
  topupSchema,
} from '@kidsstory/shared'
import { db } from '../context.js'
import { env, isPaymentsConfigured } from '../env.js'
import {
  CasheraError,
  createCasheraPayment,
  FAIL_STATUSES,
  getCasheraTransaction,
  SUCCESS_STATUSES,
  verifyWebhookAuth,
} from '../lib/cashera.js'
import { creditTokens } from '../lib/tokens.js'

export async function paymentRoutes(app: FastifyInstance) {
  app.get('/payments/packs', async () => ({ packs: PACKS }))

  app.post('/payments/topup', { preHandler: [app.authenticate] }, async (req, reply) => {
    if (!isPaymentsConfigured) {
      return reply.code(503).send({ error: 'Оплата временно недоступна' })
    }
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
      const resultUrl = `${env.WEB_URL}/payment-result?paymentId=${payment.id}`
      const tx = await createCasheraPayment({
        amountMinor: payment.amountMinor,
        externalId: payment.id,
        description: `Киномалыш · ${pack.label}`,
        paymentMethod: body.method,
        successUrl: resultUrl,
        failUrl: `${resultUrl}&failed=1`,
        callbackUrl: `${env.WEB_URL}/api/payments/cashera/webhook`,
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
    let payment = await db.query.payments.findFirst({
      where: eq(payments.id, (req.params as { id: string }).id),
    })
    if (!payment || payment.userId !== req.userId) {
      return reply.code(404).send({ error: 'Платёж не найден' })
    }

    if (payment.status === 'pending' && payment.casheraUuid) {
      const remote = await getCasheraTransaction(payment.casheraUuid).catch(() => null)
      if (remote) {
        const settled = await settlePayment(payment, remote.status.toLowerCase())
        if (settled) {
          req.log.info(
            { paymentId: payment.id, status: remote.status },
            'payment reconciled from cashera',
          )
          payment = (await db.query.payments.findFirst({ where: eq(payments.id, payment.id) }))!
        }
      }
    }

    return { id: payment.id, status: payment.status, tokens: payment.tokens }
  })

  app.post('/payments/cashera/webhook', async (req, reply) => {
    if (!verifyWebhookAuth(req.headers['x-api-key'], req.headers['x-secret'])) {
      return reply.code(401).send({ error: 'unauthorized' })
    }

    if (isTestWebhook(req.body)) {
      req.log.info('cashera webhook: проверочное событие')
      return reply.code(200).send({ ok: true })
    }

    const event = extractCasheraEvent(req.body)
    if (!event) {
      req.log.warn({ body: req.body }, 'cashera webhook: не удалось прочитать событие')
      return reply.code(200).send({ ok: true })
    }
    const { uuid, externalId, status } = event

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

    const settled = await settlePayment(payment, status)
    if (settled) {
      req.log.info({ paymentId: payment.id, status, tokens: payment.tokens }, 'payment settled')
    }

    return reply.code(200).send({ ok: true })
  })
}

async function settlePayment(
  payment: typeof payments.$inferSelect,
  status: string,
): Promise<boolean> {
  if (SUCCESS_STATUSES.has(status)) {
    const [claimed] = await db
      .update(payments)
      .set({ status: 'succeeded', credited: true, updatedAt: new Date() })
      .where(and(eq(payments.id, payment.id), eq(payments.credited, false)))
      .returning()
    if (!claimed) return false
    await creditTokens(db, payment.userId, payment.tokens, { paymentId: payment.id })
    return true
  }

  if (FAIL_STATUSES.has(status) && payment.status === 'pending') {
    await db
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(and(eq(payments.id, payment.id), eq(payments.status, 'pending')))
    return true
  }

  return false
}
