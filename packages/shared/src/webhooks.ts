export interface CasheraWebhookEvent {
  uuid: string
  externalId: string
  status: string
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function isTestWebhook(body: unknown): boolean {
  return asString(asRecord(body).event) === 'webhook.test'
}

export function extractCasheraEvent(body: unknown): CasheraWebhookEvent | null {
  const root = asRecord(body)
  const nested = { ...asRecord(root.data), ...asRecord(root.transaction) }

  const uuid = asString(nested.uuid) ?? asString(root.uuid)
  const externalId = asString(nested.external_id) ?? asString(root.external_id)
  const status = asString(nested.status) ?? asString(root.status)

  if (!uuid || !externalId || !status) return null
  return { uuid, externalId, status: status.toLowerCase() }
}
