import { describe, expect, it } from 'vitest'
import {
  buildProductScenePrompt,
  buildReelPrompt,
  estimateVideoCostUsd,
  PRODUCT_STYLE,
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

describe('estimateVideoCostUsd', () => {
  it('считает стоимость только по геройским сценам', () => {
    expect(estimateVideoCostUsd(8)).toBe(Number((8 * VIDEO_MODEL.costUsdPerClip).toFixed(2)))
  })

  it('нулевой заказ ничего не стоит', () => {
    expect(estimateVideoCostUsd(0)).toBe(0)
  })
})
