import { describe, expect, it } from 'vitest'
import { extractCasheraEvent, isTestWebhook } from '../webhooks.js'

const REAL_PAYLOAD = {
  event: 'transaction.status_updated',
  transaction: {
    uuid: '9b1f2c4e-7a01-4b9d-8f1c-2eab57d90c11',
    external_id: 'order-10428',
    status: 'paid',
    amount: 49900,
    payment_method: 'sbp',
  },
}

describe('extractCasheraEvent', () => {
  it('читает боевой формат Cashera с объектом transaction', () => {
    expect(extractCasheraEvent(REAL_PAYLOAD)).toEqual({
      uuid: '9b1f2c4e-7a01-4b9d-8f1c-2eab57d90c11',
      externalId: 'order-10428',
      status: 'paid',
    })
  })

  it('понимает вложение в data', () => {
    const event = extractCasheraEvent({ data: { uuid: 'u', external_id: 'e', status: 'PAID' } })
    expect(event).toEqual({ uuid: 'u', externalId: 'e', status: 'paid' })
  })

  it('понимает плоский формат', () => {
    const event = extractCasheraEvent({ uuid: 'u', external_id: 'e', status: 'failed' })
    expect(event).toEqual({ uuid: 'u', externalId: 'e', status: 'failed' })
  })

  it('приводит статус к нижнему регистру', () => {
    expect(extractCasheraEvent({ ...REAL_PAYLOAD, transaction: { ...REAL_PAYLOAD.transaction, status: 'PAID' } })?.status).toBe('paid')
  })

  it('transaction важнее data, если пришли оба', () => {
    const event = extractCasheraEvent({
      data: { uuid: 'старый', external_id: 'старый', status: 'pending' },
      transaction: { uuid: 'новый', external_id: 'новый', status: 'paid' },
    })
    expect(event).toEqual({ uuid: 'новый', externalId: 'новый', status: 'paid' })
  })

  it('возвращает null, когда полей не хватает', () => {
    expect(extractCasheraEvent({ event: 'transaction.status_updated' })).toBeNull()
    expect(extractCasheraEvent({ transaction: { uuid: 'u', status: 'paid' } })).toBeNull()
    expect(extractCasheraEvent(null)).toBeNull()
    expect(extractCasheraEvent('строка')).toBeNull()
  })

  it('не принимает пустые строки за значения', () => {
    expect(extractCasheraEvent({ transaction: { uuid: '', external_id: 'e', status: 'paid' } })).toBeNull()
  })
})

describe('isTestWebhook', () => {
  it('узнаёт проверочное событие', () => {
    expect(isTestWebhook({ event: 'webhook.test' })).toBe(true)
  })

  it('не путает с боевым', () => {
    expect(isTestWebhook(REAL_PAYLOAD)).toBe(false)
  })
})
