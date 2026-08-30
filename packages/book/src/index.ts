import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { BookDocument, registerFonts } from './Book.js'
import type { BookSpec } from './types.js'

export * from './design.js'
export * from './prompt.js'
export type { BookPage, BookSpec } from './types.js'

const FONT_DIR = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../assets/fonts')

let fontsReady = false

export async function renderBookPdf(spec: BookSpec): Promise<Uint8Array> {
  if (spec.pages.length === 0) throw new Error('в книге нет страниц')
  if (!fontsReady) {
    registerFonts(FONT_DIR)
    fontsReady = true
  }
  const element = createElement(BookDocument, { spec })
  const buffer = await renderToBuffer(element as Parameters<typeof renderToBuffer>[0])
  return new Uint8Array(buffer)
}
