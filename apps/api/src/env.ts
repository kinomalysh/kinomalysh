import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().default('postgres://kidsstory:kidsstory@localhost:5433/kidsstory'),
  REDIS_URL: z.string().default('redis://localhost:6380'),
  JWT_SECRET: z.string().min(16).default('dev-secret-change-me-please'),
  WEB_URL: z.string().default('http://localhost:5199'),
  ADMIN_URL: z.string().default('http://localhost:5299'),
  PUBLIC_API_URL: z.string().default('http://localhost:3001'),
  UPLOADS_DIR: z.string().default('./uploads'),
  CASHERA_API_URL: z.string().default('https://api.cashera.cash/api/v1'),
  CASHERA_API_KEY: z.string().default(''),
  CASHERA_SECRET: z.string().default(''),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('Киномалыш <hello@kinomalysh.ru>'),
})

export const env = envSchema.parse(process.env)

export function assertProdSecrets() {
  if (process.env.NODE_ENV === 'production') {
    if (env.JWT_SECRET === 'dev-secret-change-me-please') {
      throw new Error('JWT_SECRET must be set in production')
    }
    if (!env.CASHERA_API_KEY || !env.CASHERA_SECRET) {
      console.warn('[env] CASHERA_API_KEY/CASHERA_SECRET не заданы — платежи отключены')
    }
  }
}

export const isPaymentsConfigured = Boolean(env.CASHERA_API_KEY && env.CASHERA_SECRET)
