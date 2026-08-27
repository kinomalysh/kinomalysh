export const PHOTO_RETENTION_DAYS = 7
export const RESULT_RETENTION_DAYS = 30
export const CONSENT_VERSION = '2026-08-27'

export function resultExpiryFrom(readyAt: Date): Date {
  return new Date(readyAt.getTime() + RESULT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

export function photoPurgeCutoff(now: Date): Date {
  return new Date(now.getTime() - PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000)
}

export function daysLeft(expiresAt: Date, now: Date): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
}
