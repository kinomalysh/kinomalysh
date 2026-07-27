import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { adminRefreshTokens } from '@kidsstory/db'
import { db } from '../context.js'

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function issueAdminTokens(app: FastifyInstance, adminId: string) {
  const accessToken = app.jwt.sign({ sub: adminId, role: 'admin' }, { expiresIn: '30m' })
  const refreshToken = randomBytes(48).toString('base64url')
  await db.insert(adminRefreshTokens).values({
    adminId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  })
  return { accessToken, refreshToken }
}

export async function rotateAdminRefresh(app: FastifyInstance, refreshToken: string) {
  const tokenHash = hashToken(refreshToken)
  const existing = await db.query.adminRefreshTokens.findFirst({
    where: and(eq(adminRefreshTokens.tokenHash, tokenHash), gt(adminRefreshTokens.expiresAt, new Date())),
  })
  if (!existing) return null
  await db.delete(adminRefreshTokens).where(eq(adminRefreshTokens.id, existing.id))
  return issueAdminTokens(app, existing.adminId)
}

export async function revokeAdminRefresh(refreshToken: string) {
  await db.delete(adminRefreshTokens).where(eq(adminRefreshTokens.tokenHash, hashToken(refreshToken)))
}
