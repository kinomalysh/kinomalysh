const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'
const REFRESH_KEY = 'kinomalysh.refresh'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message)
  }
}

let accessToken: string | null = null
let refreshInFlight: Promise<boolean> | null = null

const isBrowser = typeof window !== 'undefined'

export function readRefreshToken(): string | null {
  if (!isBrowser) return null
  try {
    return window.localStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

export function storeSession(tokens: { accessToken: string; refreshToken: string }): void {
  accessToken = tokens.accessToken
  if (!isBrowser) return
  try {
    window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
  } catch {
    /* приватный режим - живём одной вкладкой */
  }
}

export function clearSession(): void {
  accessToken = null
  if (!isBrowser) return
  try {
    window.localStorage.removeItem(REFRESH_KEY)
  } catch {
    /* нечего чистить */
  }
}

export function hasSession(): boolean {
  return Boolean(accessToken || readRefreshToken())
}

async function parseError(res: Response): Promise<ApiError> {
  const payload = await res.json().catch(() => null)
  const message =
    payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `Ошибка ${res.status}`
  return new ApiError(message, res.status, payload)
}

async function refreshAccess(): Promise<boolean> {
  const refreshToken = readRefreshToken()
  if (!refreshToken) return false
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (!res.ok) {
          clearSession()
          return false
        }
        const tokens = (await res.json()) as { accessToken: string; refreshToken: string }
        storeSession(tokens)
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean
  signal?: AbortSignal
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, signal } = options

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = {}
    const isForm = body instanceof FormData
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  }

  if (auth && !accessToken && readRefreshToken()) await refreshAccess()

  let res = await send()
  if (res.status === 401 && auth && (await refreshAccess())) {
    res = await send()
  }
  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  return api<T>(path, { method: 'POST', body: form })
}
