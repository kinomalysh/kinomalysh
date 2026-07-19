import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: '../../packages/db/src/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://kidsstory:kidsstory@localhost:5433/kidsstory',
  },
})
