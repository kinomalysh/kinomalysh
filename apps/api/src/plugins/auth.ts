import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../env.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    userId: string
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role?: 'admin' }
    user: { sub: string; role?: 'admin' }
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(jwt, { secret: env.JWT_SECRET })

  app.decorateRequest('userId', '')
  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
      req.userId = req.user.sub
    } catch {
      return reply.code(401).send({ error: 'Требуется вход' })
    }
  })
})
