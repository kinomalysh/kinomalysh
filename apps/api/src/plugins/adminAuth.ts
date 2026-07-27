import fp from 'fastify-plugin'
import { eq } from 'drizzle-orm'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { admins } from '@kidsstory/db'
import { db } from '../context.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticateAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    adminId: string
  }
}

export const adminAuthPlugin = fp(async (app) => {
  app.decorateRequest('adminId', '')
  app.decorate('authenticateAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = await req.jwtVerify<{ sub: string; role?: string }>()
      if (payload.role !== 'admin') {
        return reply.code(403).send({ error: 'Доступ только для администраторов' })
      }
      const admin = await db.query.admins.findFirst({ where: eq(admins.id, payload.sub) })
      if (!admin) return reply.code(401).send({ error: 'Требуется вход' })
      req.adminId = admin.id
    } catch {
      return reply.code(401).send({ error: 'Требуется вход' })
    }
  })
})
