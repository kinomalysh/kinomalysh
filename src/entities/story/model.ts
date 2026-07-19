import { create } from 'zustand'

export type StoryFormat = 'video' | 'book'
export type StoryStatus = 'casting' | 'awaiting-choice' | 'rendering' | 'ready' | 'failed'

export interface Story {
  id: string
  plotId: string
  childName: string
  format: StoryFormat
  status: StoryStatus
  createdAt: string
  expiresInDays: number
  durationLabel: string
}

interface LibraryState {
  stories: Story[]
  addStory: (story: Story) => void
}

const SEED: Story[] = [
  {
    id: 'demo-1',
    plotId: 'sleep',
    childName: 'Алиса',
    format: 'video',
    status: 'ready',
    createdAt: '2026-07-12',
    expiresInDays: 23,
    durationLabel: '2 мин 10 сек',
  },
  {
    id: 'demo-2',
    plotId: 'teeth',
    childName: 'Алиса',
    format: 'book',
    status: 'ready',
    createdAt: '2026-07-05',
    expiresInDays: 16,
    durationLabel: '8 страниц',
  },
]

export const useLibrary = create<LibraryState>((set) => ({
  stories: SEED,
  addStory: (story) => set((s) => ({ stories: [story, ...s.stories] })),
}))

export const STATUS_LABELS: Record<StoryStatus, string> = {
  casting: 'Кастинг героя',
  'awaiting-choice': 'Ждёт вашего выбора',
  rendering: 'Создаётся',
  ready: 'Готова',
  failed: 'Ошибка',
}
