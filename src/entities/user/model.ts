import { create } from 'zustand'

interface UserState {
  isAuthed: boolean
  name: string
  balance: number
  signIn: (name: string) => void
  signOut: () => void
  spend: (tokens: number) => boolean
  topUp: (tokens: number) => void
}

export const useUser = create<UserState>((set, get) => ({
  isAuthed: true,
  name: 'Павел',
  balance: 240,
  signIn: (name) => set({ isAuthed: true, name }),
  signOut: () => set({ isAuthed: false, name: '', balance: 0 }),
  spend: (tokens) => {
    if (get().balance < tokens) return false
    set((s) => ({ balance: s.balance - tokens }))
    return true
  },
  topUp: (tokens) => set((s) => ({ balance: s.balance + tokens })),
}))
