import { createHash, randomBytes, randomInt } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { and, eq, gt } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { emailOtps, refreshTokens, users } from '@kidsstory/db'
import { loginSchema, registerSchema } from '@kidsstory/shared'
import { z } from 'zod'
import { db } from '../context.js'
import { sendOtpEmail } from '../lib/mailer.js'

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000
const OTP_TTL_MS = 10 * 60 * 1000
const OTP_MAX_ATTEMPTS = 5

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4}$/),
})

const resendSchema = z.object({ email: z.string().email() })

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function issueTokens(app: FastifyInstance, userId: string) {
  const accessToken = app.jwt.sign({ sub: userId }, { expiresIn: '15m' })
  const refreshToken = randomBytes(48).toString('base64url')
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  })
  return { accessToken, refreshToken }
}

async function createAndSendOtp(email: string, name: string) {
  const code = String(randomInt(0, 10000)).padStart(4, '0')
  await db.delete(emailOtps).where(eq(emailOtps.email, email))
  await db.insert(emailOtps).values({
    email,
    codeHash: hashToken(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  })
  await sendOtpEmail(email, name, code)
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const existing = await db.query.users.findFirst({ where: eq(users.email, body.email) })
    if (existing?.emailVerified) {
      return reply.code(409).send({ error: 'Пользователь с таким email уже есть' })
    }

    const passwordHash = await bcrypt.hash(body.password, 10)
    if (existing) {
      await db
        .update(users)
        .set({ passwordHash, name: body.name })
        .where(eq(users.id, existing.id))
    } else {
      await db.insert(users).values({ email: body.email, passwordHash, name: body.name })
    }

    await createAndSendOtp(body.email, body.name)
    return reply.code(201).send({ ok: true, message: 'Код отправлен на почту' })
  })

  app.post('/auth/verify-email', { config: { rateLimit: { max: 20, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const body = verifySchema.parse(req.body)
    const otp = await db.query.emailOtps.findFirst({
      where: and(eq(emailOtps.email, body.email), gt(emailOtps.expiresAt, new Date())),
    })
    if (!otp) return reply.code(400).send({ error: 'Код истёк — запросите новый' })
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return reply.code(429).send({ error: 'Слишком много попыток — запросите новый код' })
    }

    if (otp.codeHash !== hashToken(body.code)) {
      await db
        .update(emailOtps)
        .set({ attempts: otp.attempts + 1 })
        .where(eq(emailOtps.id, otp.id))
      return reply.code(400).send({ error: 'Неверный код' })
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) })
    if (!user) return reply.code(400).send({ error: 'Сначала зарегистрируйтесь' })

    await db.delete(emailOtps).where(eq(emailOtps.id, otp.id))
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, user.id))

    const tokens = await issueTokens(app, user.id)
    return { user: publicUser({ ...user, emailVerified: true }), ...tokens }
  })

  app.post('/auth/resend-code', { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const body = resendSchema.parse(req.body)
    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) })
    if (!user || user.emailVerified) {
      return reply.code(200).send({ ok: true })
    }
    const recent = await db.query.emailOtps.findFirst({
      where: and(
        eq(emailOtps.email, body.email),
        gt(emailOtps.createdAt, new Date(Date.now() - 60 * 1000)),
      ),
    })
    if (recent) return reply.code(429).send({ error: 'Код уже отправлен — подождите минуту' })
    await createAndSendOtp(body.email, user.name)
    return { ok: true }
  })

  app.post('/auth/login', { config: { rateLimit: { max: 15, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const body = loginSchema.parse(req.body)
    const user = await db.query.users.findFirst({ where: eq(users.email, body.email) })
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Неверный email или пароль' })
    }
    if (!user.emailVerified) {
      await createAndSendOtp(user.email, user.name)
      return reply.code(403).send({ error: 'Подтвердите почту — код отправлен', needVerify: true })
    }
    const tokens = await issueTokens(app, user.id)
    return { user: publicUser(user), ...tokens }
  })

  app.post('/auth/refresh', { config: { rateLimit: { max: 30, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: string }
    if (!refreshToken) return reply.code(400).send({ error: 'refreshToken обязателен' })

    const stored = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, hashToken(refreshToken)),
    })
    if (!stored || stored.expiresAt.getTime() < Date.now()) {
      return reply.code(401).send({ error: 'Сессия истекла, войдите заново' })
    }

    await db.delete(refreshTokens).where(eq(refreshTokens.id, stored.id))
    return issueTokens(app, stored.userId)
  })

  app.get('/auth/me', { preHandler: [app.authenticate] }, async (req) => {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.userId) })
    return { user: user ? publicUser(user) : null }
  })
}

function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    balance: user.balance,
    emailVerified: user.emailVerified,
  }
}
