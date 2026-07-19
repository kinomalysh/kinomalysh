import { eq, sql } from 'drizzle-orm'
import { tokenLedger, users } from '@kidsstory/db'
import type { Database } from '@kidsstory/db'

export class InsufficientBalanceError extends Error {
  constructor() {
    super('Недостаточно токенов')
  }
}

interface LedgerRef {
  storyId?: string
  paymentId?: string
}

export async function holdTokens(db: Database, userId: string, amount: number, ref: LedgerRef) {
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(users)
      .set({ balance: sql`${users.balance} - ${amount}` })
      .where(sql`${users.id} = ${userId} and ${users.balance} >= ${amount}`)
      .returning({ balance: users.balance })
    if (updated.length === 0) throw new InsufficientBalanceError()
    await tx.insert(tokenLedger).values({
      userId,
      delta: -amount,
      kind: 'hold',
      storyId: ref.storyId,
      paymentId: ref.paymentId,
    })
  })
}

export async function refundTokens(db: Database, userId: string, amount: number, ref: LedgerRef) {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId))
    await tx.insert(tokenLedger).values({
      userId,
      delta: amount,
      kind: 'refund',
      storyId: ref.storyId,
      paymentId: ref.paymentId,
    })
  })
}

export async function creditTokens(db: Database, userId: string, amount: number, ref: LedgerRef) {
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ balance: sql`${users.balance} + ${amount}` })
      .where(eq(users.id, userId))
    await tx.insert(tokenLedger).values({
      userId,
      delta: amount,
      kind: 'topup',
      storyId: ref.storyId,
      paymentId: ref.paymentId,
    })
  })
}
