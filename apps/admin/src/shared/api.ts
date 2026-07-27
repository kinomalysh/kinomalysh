const ACCESS_KEY = 'km_admin_access'
const REFRESH_KEY = 'km_admin_refresh'

export interface AdminInfo {
  id: string
  login: string
  name: string
}

export function getAccess(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
  }
}

async function refreshAccess(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (!refreshToken) return false
  const res = await fetch('/api/admin/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) {
    clearTokens()
    return false
  }
  const data = (await res.json()) as { accessToken: string; refreshToken: string }
  setTokens(data.accessToken, data.refreshToken)
  return true
}

interface RequestOptions {
  method?: string
  body?: unknown
  isForm?: boolean
  retry?: boolean
}

export async function api<T>(pathname: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, isForm = false, retry = true } = options
  const headers: Record<string, string> = {}
  const access = getAccess()
  if (access) headers.Authorization = `Bearer ${access}`
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'

  const res = await fetch(`/api${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  })

  if (res.status === 401 && retry && (await refreshAccess())) {
    return api<T>(pathname, { ...options, retry: false })
  }

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw new ApiError(data.error ?? 'Ошибка запроса', res.status)
  }
  return data as T
}

export async function login(loginName: string, password: string): Promise<AdminInfo> {
  const res = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginName, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new ApiError(data.error ?? 'Не удалось войти', res.status)
  setTokens(data.accessToken, data.refreshToken)
  return data.admin as AdminInfo
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_KEY)
  if (refreshToken) {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined)
  }
  clearTokens()
}

export { ApiError }
