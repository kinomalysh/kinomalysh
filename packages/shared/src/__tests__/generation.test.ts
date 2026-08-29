import { describe, expect, it } from 'vitest'
import {
  buildProductFramePrompt,
  buildProductScenePrompt,
  buildReelFramePrompt,
  buildReelPrompt,
  estimateVideoCostUsd,
  FRAME_GUARD,
  PRODUCT_STYLE,
  REEL_FRAME_STYLE,
  REEL_NEGATIVE_PROMPT,
  REEL_STYLE,
  VIDEO_MODEL,
} from '../generation.js'

describe('buildProductScenePrompt', () => {
  it('добавляет фирменный стиль', () => {
    expect(buildProductScenePrompt('A boy brushes teeth')).toBe(
      `A boy brushes teeth, ${PRODUCT_STYLE}`,
    )
  })

  it('снимает завершающую точку, чтобы не рвать перечисление', () => {
    expect(buildProductScenePrompt('A boy waves.')).toBe(`A boy waves, ${PRODUCT_STYLE}`)
  })

  it('обрезает лишние пробелы', () => {
    expect(buildProductScenePrompt('  A boy waves  ')).toBe(`A boy waves, ${PRODUCT_STYLE}`)
  })
})

describe('buildReelPrompt', () => {
  it('использует вертикальный рекламный стиль', () => {
    expect(buildReelPrompt('A girl smiles')).toBe(`A girl smiles, ${REEL_STYLE}`)
  })
})

describe('buildReelFramePrompt', () => {
  it('запрещает раскадровку до описания сцены', () => {
    const prompt = buildReelFramePrompt('A girl runs to the door')
    expect(prompt.startsWith(FRAME_GUARD)).toBe(true)
    expect(prompt).toContain('Scene: A girl runs to the door')
    expect(prompt).toContain(REEL_FRAME_STYLE)
  })

  it('не тащит в кадр видеостиль с движением камеры', () => {
    expect(buildReelFramePrompt('A girl smiles')).not.toContain('single continuous shot')
  })
})

describe('buildProductFramePrompt', () => {
  it('использует продуктовый стиль под тем же запретом', () => {
    const prompt = buildProductFramePrompt('A boy brushes teeth.')
    expect(prompt).toBe(`${FRAME_GUARD}\n\nScene: A boy brushes teeth, ${PRODUCT_STYLE}`)
  })
})

describe('REEL_NEGATIVE_PROMPT', () => {
  it('отсекает панели и коллажи', () => {
    for (const term of ['split screen', 'collage', 'storyboard', 'comic panels', 'grid']) {
      expect(REEL_NEGATIVE_PROMPT).toContain(term)
    }
  })
})

describe('estimateVideoCostUsd', () => {
  it('считает стоимость только по геройским сценам', () => {
    expect(estimateVideoCostUsd(8)).toBe(Number((8 * VIDEO_MODEL.costUsdPerClip).toFixed(2)))
  })

  it('нулевой заказ ничего не стоит', () => {
    expect(estimateVideoCostUsd(0)).toBe(0)
  })
})
