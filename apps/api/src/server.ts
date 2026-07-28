import path from 'node:path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { ZodError } from 'zod'
import { PLOTS } from '@kidsstory/shared'
import { assertProdSecrets, env } from './env.js'
import { adminAuthPlugin } from './plugins/adminAuth.js'
import { authPlugin } from './plugins/auth.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { paymentRoutes } from './routes/payments.js'
import { productRoutes } from './routes/products.js'
import { storyRoutes } from './routes/stories.js'

async function main() {
  assertProdSecrets()

  const app = Fastify({ logger: true })

  await app.register(cors, { origin: [env.WEB_URL, env.ADMIN_URL], credentials: true })
  await app.register(multipart)
  await app.register(fastifyStatic, {
    root: path.resolve(env.UPLOADS_DIR),
    prefix: '/uploads/',
  })
  await app.register(authPlugin)
  await app.register(adminAuthPlugin)

  app.setErrorHandler((error, req, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: 'Неверные данные', details: error.flatten() })
    }
    req.log.error(error)
    return reply.code(500).send({ error: 'Что-то пошло не так' })
  })

  app.get('/health', async () => ({ ok: true }))
  app.get('/plots', async () => ({
    plots: PLOTS.map(({ scenePrompts, ...plot }) => plot),
  }))

  await app.register(authRoutes)
  await app.register(storyRoutes)
  await app.register(paymentRoutes)
  await app.register(adminRoutes)
  await app.register(productRoutes)

  await app.listen({ port: env.PORT, host: '0.0.0.0' })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
