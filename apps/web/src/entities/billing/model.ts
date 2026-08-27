import { api } from '@/shared/api/client'

export interface Pack {
  id: string
  rub: number
  tokens: number
  label: string
  badge?: string
  popular?: boolean
}

export interface PaymentRecord {
  id: string
  packId: string
  amountRub: number
  tokens: number
  status: 'pending' | 'succeeded' | 'failed' | 'canceled'
  paymentUrl: string | null
  createdAt: string
}

export interface LedgerEntry {
  id: string
  delta: number
  kind: string
  storyId: string | null
  createdAt: string
}

export const LEDGER_LABELS: Record<string, string> = {
  topup: 'Пополнение',
  hold: 'Оплата мультфильма',
  refund: 'Возврат',
  bonus: 'Бонус',
}

export async function fetchPacks(): Promise<Pack[]> {
  const { packs } = await api<{ packs: Pack[] }>('/payments/packs', { auth: false })
  return packs
}

export async function startTopup(
  packId: string,
): Promise<{ paymentId: string; paymentUrl: string | null }> {
  return api('/payments/topup', { method: 'POST', body: { packId } })
}

export async function fetchPaymentStatus(
  id: string,
): Promise<{ id: string; status: string; tokens: number }> {
  return api(`/payments/${id}`)
}

export async function fetchPayments(): Promise<PaymentRecord[]> {
  const { payments } = await api<{ payments: PaymentRecord[] }>('/me/payments')
  return payments
}

export async function fetchLedger(): Promise<LedgerEntry[]> {
  const { entries } = await api<{ entries: LedgerEntry[] }>('/me/ledger')
  return entries
}

export async function deleteAccount(): Promise<void> {
  await api('/me', { method: 'DELETE' })
}
