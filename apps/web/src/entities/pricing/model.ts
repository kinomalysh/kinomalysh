export interface Pack {
  id: string
  rub: number
  tokens: number
  label: string
  badge?: string
  popular?: boolean
}

export const PACKS: Pack[] = [
  { id: 'pack-book', rub: 250, tokens: 25, label: 'Книга-сказка' },
  { id: 'pack-video', rub: 1990, tokens: 199, label: 'Один мультфильм' },
  { id: 'pack-hero', rub: 3490, tokens: 349, label: 'Супергеройский мультфильм', badge: 'Новинка' },
  { id: 'pack-family', rub: 5990, tokens: 799, label: 'Семейный 3+1', badge: '+1 сказка в подарок', popular: true },
]

export const PRICE_VIDEO_TOKENS = 199
export const PRICE_HERO_TOKENS = 349
export const PRICE_BOOK_TOKENS = 25
