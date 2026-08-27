import { create } from 'zustand'
import { api, clearSession, hasSession, storeSession } from '@/shared/api/client'

export interface SessionUser {
  id: string
  email: string
  name: string
  balance: number
  emailVerified: boolean
}

type Status = 'loading' | 'anon' | 'authed'

interface AuthPayload {
  user: SessionUser
  accessToken: string
  refreshToken: string
}

interface SessionState {
  status: Status
  user: SessionUser | null
  bootstrap: () => Promise<void>
  register: (input: { email: string; password: string; name: string }) => Promise<void>
  verify: (input: { email: string; code: string }) => Promise<void>
  resend: (email: string) => Promise<void>
  login: (input: { email: string; password: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  applyBalance: (balance: number) => void
}

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  user: null,

  bootstrap: async () => {
    if (!hasSession()) {
      set({ status: 'anon', user: null })
      return
    }
    try {
      const { user } = await api<{ user: SessionUser | null }>('/auth/me')
      set(user ? { status: 'authed', user } : { status: 'anon', user: null })
    } catch {
      clearSession()
      set({ status: 'anon', user: null })
    }
  },

  register: async (input) => {
    await api('/auth/register', { method: 'POST', body: input, auth: false })
  },

  verify: async (input) => {
    const payload = await api<AuthPayload>('/auth/verify-email', {
      method: 'POST',
      body: input,
      auth: false,
    })
    storeSession(payload)
    set({ status: 'authed', user: payload.user })
  },

  resend: async (email) => {
    await api('/auth/resend-code', { method: 'POST', body: { email }, auth: false })
  },

  login: async (input) => {
    const payload = await api<AuthPayload>('/auth/login', {
      method: 'POST',
      body: input,
      auth: false,
    })
    storeSession(payload)
    set({ status: 'authed', user: payload.user })
  },

  logout: () => {
    clearSession()
    set({ status: 'anon', user: null })
  },

  refreshUser: async () => {
    try {
      const { user } = await api<{ user: SessionUser | null }>('/auth/me')
      if (user) set({ status: 'authed', user })
    } catch {
      /* обновление баланса не должно ронять экран */
    }
  },

  applyBalance: (balance) =>
    set((state) => (state.user ? { user: { ...state.user, balance } } : state)),
}))
