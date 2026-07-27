import { create } from 'zustand'
import { api, clearTokens, getAccess, type AdminInfo } from './api'

interface AuthState {
  admin: AdminInfo | null
  status: 'loading' | 'authed' | 'anon'
  setAdmin: (admin: AdminInfo) => void
  bootstrap: () => Promise<void>
  signOut: () => void
}

export const useAuth = create<AuthState>((set) => ({
  admin: null,
  status: 'loading',
  setAdmin: (admin) => set({ admin, status: 'authed' }),
  bootstrap: async () => {
    if (!getAccess()) {
      set({ status: 'anon' })
      return
    }
    try {
      const { admin } = await api<{ admin: AdminInfo | null }>('/admin/me')
      if (admin) set({ admin, status: 'authed' })
      else set({ status: 'anon' })
    } catch {
      clearTokens()
      set({ status: 'anon', admin: null })
    }
  },
  signOut: () => set({ admin: null, status: 'anon' }),
}))
