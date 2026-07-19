import { create } from 'zustand'
import { PRICE_HERO_TOKENS, PRICE_VIDEO_TOKENS, PRICE_BOOK_TOKENS } from '@/entities/pricing/model'
import { getPlot } from '@/entities/plot/model'

export type WizardStep = 'plot' | 'hero' | 'photo' | 'casting' | 'scenes' | 'payment' | 'done'

export const STEP_ORDER: WizardStep[] = ['photo', 'casting', 'hero', 'plot', 'scenes', 'payment', 'done']

export type Gender = 'boy' | 'girl'
export type Format = 'video' | 'book'

export interface AvatarVariant {
  id: number
  hue: number
  accentHue: number
}

interface WizardState {
  step: WizardStep
  format: Format
  plotId: string | null
  childName: string
  childAge: number | null
  gender: Gender | null
  photoUrl: string | null
  consentGuardian: boolean
  consentTransfer: boolean
  castingLoading: boolean
  avatars: AvatarVariant[]
  chosenAvatar: number | null
  scenesApproved: boolean
  setFormat: (f: Format) => void
  choosePlot: (id: string) => void
  setHero: (patch: Partial<Pick<WizardState, 'childName' | 'childAge' | 'gender'>>) => void
  startPhotoStep: () => void
  setPhoto: (url: string | null) => void
  setConsent: (key: 'consentGuardian' | 'consentTransfer', value: boolean) => void
  startCasting: () => void
  recast: () => void
  chooseAvatar: (id: number) => void
  approveScenes: () => void
  pay: () => void
  goBack: () => void
  reset: () => void
}

function randomAvatars(): AvatarVariant[] {
  return Array.from({ length: 3 }, (_, id) => ({
    id,
    hue: Math.floor(Math.random() * 360),
    accentHue: Math.floor(Math.random() * 360),
  }))
}

const initial = {
  step: 'photo' as WizardStep,
  format: 'video' as Format,
  plotId: null,
  childName: '',
  childAge: null,
  gender: null,
  photoUrl: null,
  consentGuardian: false,
  consentTransfer: false,
  castingLoading: false,
  avatars: [],
  chosenAvatar: null,
  scenesApproved: false,
}

export const useWizard = create<WizardState>((set, get) => ({
  ...initial,
  setFormat: (format) => set({ format }),
  choosePlot: (plotId) => set({ plotId, step: 'scenes' }),
  setHero: (patch) => set(patch),
  startPhotoStep: () => set({ step: 'plot' }),
  setPhoto: (photoUrl) => set({ photoUrl }),
  setConsent: (key, value) =>
    set(key === 'consentGuardian' ? { consentGuardian: value } : { consentTransfer: value }),
  startCasting: () => {
    set({ step: 'casting', castingLoading: true, avatars: [], chosenAvatar: null })
    setTimeout(() => set({ castingLoading: false, avatars: randomAvatars() }), 2600)
  },
  recast: () => {
    set({ castingLoading: true, avatars: [], chosenAvatar: null })
    setTimeout(() => set({ castingLoading: false, avatars: randomAvatars() }), 2600)
  },
  chooseAvatar: (chosenAvatar) => set({ chosenAvatar, step: 'hero' }),
  approveScenes: () => set({ scenesApproved: true, step: 'payment' }),
  pay: () => set({ step: 'done' }),
  goBack: () => {
    const { step } = get()
    const idx = STEP_ORDER.indexOf(step)
    if (idx > 0) set({ step: STEP_ORDER[idx - 1] })
  },
  reset: () => set(initial),
}))

export function wizardPrice(state: Pick<WizardState, 'format' | 'plotId'>): number {
  if (state.format === 'book') return PRICE_BOOK_TOKENS
  return getPlot(state.plotId ?? '')?.premium ? PRICE_HERO_TOKENS : PRICE_VIDEO_TOKENS
}
