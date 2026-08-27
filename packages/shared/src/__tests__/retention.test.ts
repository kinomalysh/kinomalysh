import { describe, expect, it } from 'vitest'
import {
  daysLeft,
  photoPurgeCutoff,
  PHOTO_RETENTION_DAYS,
  RESULT_RETENTION_DAYS,
  resultExpiryFrom,
} from '../retention.js'

const DAY = 24 * 60 * 60 * 1000

describe('resultExpiryFrom', () => {
  it('добавляет срок хранения результата', () => {
    const readyAt = new Date('2026-08-01T12:00:00Z')
    expect(resultExpiryFrom(readyAt).toISOString()).toBe(
      new Date(readyAt.getTime() + RESULT_RETENTION_DAYS * DAY).toISOString(),
    )
  })
})

describe('photoPurgeCutoff', () => {
  it('отсекает фото старше срока хранения', () => {
    const now = new Date('2026-08-20T00:00:00Z')
    expect(photoPurgeCutoff(now).toISOString()).toBe(
      new Date(now.getTime() - PHOTO_RETENTION_DAYS * DAY).toISOString(),
    )
  })
})

describe('daysLeft', () => {
  it('считает оставшиеся дни вверх', () => {
    const now = new Date('2026-08-01T00:00:00Z')
    expect(daysLeft(new Date('2026-08-11T06:00:00Z'), now)).toBe(11)
  })

  it('не уходит в минус после истечения', () => {
    const now = new Date('2026-09-01T00:00:00Z')
    expect(daysLeft(new Date('2026-08-01T00:00:00Z'), now)).toBe(0)
  })
})
