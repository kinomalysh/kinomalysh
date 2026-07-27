import { randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { admins } from '@kidsstory/db'
import { db } from '../context.js'

async function main() {
  const login = process.argv[2]
  const name = process.argv[3] ?? login
  const password = process.argv[4] ?? randomBytes(9).toString('base64url')
  if (!login) {
    console.error('Использование: npm run admin:create -- <login> [name] [password]')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const existing = await db.query.admins.findFirst({ where: eq(admins.login, login) })
  if (existing) {
    await db.update(admins).set({ passwordHash, name }).where(eq(admins.id, existing.id))
    console.log(`Обновлён администратор «${login}». Новый пароль: ${password}`)
  } else {
    await db.insert(admins).values({ login, name, passwordHash })
    console.log(`Создан администратор «${login}». Пароль: ${password}`)
  }
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
