import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().default('postgres://kidsstory:kidsstory@localhost:5433/kidsstory'),
  REDIS_URL: z.string().default('redis://localhost:6380'),
  FAL_KEY: z.string().default(''),
  ELEVENLABS_API_KEY: z.string().default(''),
  UPLOADS_DIR: z.string().default('../api/uploads'),
  PUBLIC_API_URL: z.string().default('http://localhost:3001'),
})

export const env = envSchema.parse(process.env)
