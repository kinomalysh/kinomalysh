import { describe, expect, it } from 'vitest'
import {
  getPack,
  PACKS,
  PRICE_BOOK_TOKENS,
  PRICE_HERO_TOKENS,
  PRICE_VIDEO_TOKENS,
  storyPrice,
} from '../pricing.js'

describe('storyPrice', () => {
  it('книга стоит одинаково вне зависимости от премиума', () => {
    expect(storyPrice('book', false)).toBe(PRICE_BOOK_TOKENS)
    expect(storyPrice('book', true)).toBe(PRICE_BOOK_TOKENS)
  })

  it('обычный мультфильм дешевле геройского', () => {
    expect(storyPrice('video', false)).toBe(PRICE_VIDEO_TOKENS)
    expect(storyPrice('video', true)).toBe(PRICE_HERO_TOKENS)
    expect(PRICE_HERO_TOKENS).toBeGreaterThan(PRICE_VIDEO_TOKENS)
  })
})

describe('PACKS', () => {
  it('у всех пакетов уникальный id', () => {
    expect(new Set(PACKS.map((pack) => pack.id)).size).toBe(PACKS.length)
  })

  it('курс токена не дешевле десяти рублей ни в одном пакете', () => {
    for (const pack of PACKS) {
      expect(pack.rub / pack.tokens).toBeGreaterThanOrEqual(7.4)
    }
  })

  it('находит пакет по id и не выдумывает несуществующий', () => {
    expect(getPack('pack-video')?.tokens).toBe(PRICE_VIDEO_TOKENS)
    expect(getPack('pack-unknown')).toBeUndefined()
  })
})
