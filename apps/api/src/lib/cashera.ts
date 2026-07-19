import { timingSafeEqual } from 'node:crypto'
import { env } from '../env.js'

export interface CasheraTransaction {
  uuid: string
  status: string
  payment_url?: string
  external_id?: string
}

export class CasheraError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message)
  }
}

interface CreatePaymentInput {
  amountMinor: number
  currency?: string
  paymentMethod?: string
  externalId: string
  description: string
}

export async function createCasheraPayment(input: CreatePaymentInput): Promise<CasheraTransaction> {
  const res = await fetch(`${env.CASHERA_API_URL}/integration/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': env.CASHERA_API_KEY,
    },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency ?? 'RUB',
      payment_method: input.paymentMethod ?? 'sbp',
      external_id: input.externalId,
      description: input.description,
    }),
  })

  const body: unknown = await res.json().catch(() => null)
  if (res.status !== 201 && res.status !== 200) {
    throw new CasheraError(`Cashera responded ${res.status}`, res.status, body)
  }

  const tx = extractTransaction(body)
  if (!tx?.uuid) {
    throw new CasheraError('Cashera response has no transaction uuid', res.status, body)
  }
  return tx
}

export async function getCasheraTransaction(uuid: string): Promise<CasheraTransaction | null> {
  const res = await fetch(`${env.CASHERA_API_URL}/integration/transactions/${uuid}`, {
    headers: { 'X-Api-Key': env.CASHERA_API_KEY },
  })
  if (!res.ok) return null
  return extractTransaction(await res.json().catch(() => null))
}

function extractTransaction(body: unknown): CasheraTransaction | null {
  if (!body || typeof body !== 'object') return null
  const record = body as Record<string, unknown>
  const candidate = (record.data ?? record.transaction ?? record) as Record<string, unknown>
  if (typeof candidate.uuid !== 'string') return null
  return {
    uuid: candidate.uuid,
    status: String(candidate.status ?? 'pending'),
    payment_url: typeof candidate.payment_url === 'string' ? candidate.payment_url : undefined,
    external_id: typeof candidate.external_id === 'string' ? candidate.external_id : undefined,
  }
}

export function verifyWebhookAuth(apiKey: unknown, secret: unknown): boolean {
  if (typeof apiKey !== 'string' || typeof secret !== 'string') return false
  return safeEqual(apiKey, env.CASHERA_API_KEY) && safeEqual(secret, env.CASHERA_SECRET)
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export const SUCCESS_STATUSES = new Set(['success', 'succeeded', 'paid', 'completed'])
export const FAIL_STATUSES = new Set(['failed', 'canceled', 'cancelled', 'expired', 'declined'])
