import { create } from 'zustand'
import type { CatalogProduct } from '@/entities/catalog/model'
import {
  chooseAvatar,
  createProductOrder,
  fetchOrder,
  payOrder,
  recast,
  type Order,
} from '@/entities/order/model'
import { ApiError } from '@/shared/api/client'

export type WizardStep = 'product' | 'hero' | 'photo' | 'casting' | 'payment'
export type Gender = 'male' | 'female'

export const STEP_ORDER: WizardStep[] = ['product', 'hero', 'photo', 'casting', 'payment']

export type StepDirection = 'forward' | 'back'

export const STEP_TITLES: Record<WizardStep, string> = {
  product: 'Выбор мультфильма',
  hero: 'Кто главный герой',
  photo: 'Фотография',
  casting: 'Выбор героя',
  payment: 'Оплата',
}

interface WizardState {
  step: WizardStep
  direction: StepDirection
  product: CatalogProduct | null
  childName: string
  gender: Gender | null
  photo: File | null
  photoPreview: string | null
  consentGuardian: boolean
  consentTransfer: boolean
  order: Order | null
  submitting: boolean
  error: string | null
  chooseProduct: (product: CatalogProduct) => void
  setHero: (patch: { childName?: string; gender?: Gender }) => void
  goToPhoto: () => void
  setPhoto: (file: File | null) => void
  setConsent: (key: 'consentGuardian' | 'consentTransfer', value: boolean) => void
  submitOrder: () => Promise<Order | null>
  refreshOrder: () => Promise<void>
  pickVariant: (index: number) => Promise<void>
  askAnother: () => Promise<void>
  pay: () => Promise<Order | null>
  goBack: () => void
  clearError: () => void
  reset: () => void
}

const initial = {
  step: 'product' as WizardStep,
  direction: 'forward' as StepDirection,
  product: null,
  childName: '',
  gender: null,
  photo: null,
  photoPreview: null,
  consentGuardian: false,
  consentTransfer: false,
  order: null,
  submitting: false,
  error: null,
}

function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return 'Не получилось связаться с сервером - попробуйте ещё раз'
}

export const useWizard = create<WizardState>((set, get) => ({
  ...initial,

  chooseProduct: (product) =>
    set({ product, step: 'hero', direction: 'forward', error: null }),

  setHero: (patch) => set(patch),

  goToPhoto: () => set({ step: 'photo', direction: 'forward', error: null }),

  setPhoto: (file) => {
    const previous = get().photoPreview
    if (previous) URL.revokeObjectURL(previous)
    set({ photo: file, photoPreview: file ? URL.createObjectURL(file) : null })
  },

  setConsent: (key, value) =>
    set(key === 'consentGuardian' ? { consentGuardian: value } : { consentTransfer: value }),

  submitOrder: async () => {
    const { product, childName, gender, photo, consentGuardian, consentTransfer } = get()
    if (!product || !photo || !gender || !consentGuardian || !consentTransfer) return null
    set({ submitting: true, error: null })
    try {
      const order = await createProductOrder({
        slug: product.slug,
        photo,
        childName: childName.trim(),
        gender,
      })
      set({ order, step: 'casting', direction: 'forward', submitting: false })
      return order
    } catch (error) {
      set({ submitting: false, error: messageOf(error) })
      return null
    }
  },

  refreshOrder: async () => {
    const current = get().order
    if (!current) return
    try {
      set({ order: await fetchOrder(current.id) })
    } catch {
      /* опрос статуса не должен ронять экран */
    }
  },

  pickVariant: async (index) => {
    const current = get().order
    if (!current) return
    set({ submitting: true, error: null })
    try {
      const order = await chooseAvatar(current.id, index)
      set({ order, step: 'payment', direction: 'forward', submitting: false })
    } catch (error) {
      set({ submitting: false, error: messageOf(error) })
    }
  },

  askAnother: async () => {
    const current = get().order
    if (!current) return
    set({ submitting: true, error: null })
    try {
      await recast(current.id)
      set({ order: await fetchOrder(current.id), submitting: false })
    } catch (error) {
      set({ submitting: false, error: messageOf(error) })
    }
  },

  pay: async () => {
    const order = get().order
    if (!order) return null
    set({ submitting: true, error: null })
    try {
      const paid = await payOrder(order.id)
      set({ order: paid, submitting: false })
      return paid
    } catch (error) {
      set({ submitting: false, error: messageOf(error) })
      return null
    }
  },

  goBack: () => {
    const index = STEP_ORDER.indexOf(get().step)
    if (index > 0) set({ step: STEP_ORDER[index - 1], direction: 'back', error: null })
  },

  clearError: () => set({ error: null }),

  reset: () => {
    const preview = get().photoPreview
    if (preview) URL.revokeObjectURL(preview)
    set(initial)
  },
}))
