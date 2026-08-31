import { and, eq, isNotNull } from 'drizzle-orm'
import { createDb, productPages, products, settings } from '@kidsstory/db'
import { getObject, isStorageConfigured, uploadObject } from '@kidsstory/storage'
import { toJpeg } from './ffmpeg.js'

type Db = ReturnType<typeof createDb>

const FLAG = 'catalog_images_jpeg'
const COVER_WIDTH = 640
const PAGE_WIDTH = 900

// Разовый проход по уже нарисованным витринным картинкам: модель не зовём,
// просто уменьшаем и пережимаем. Обложка 1024 PNG весит около полутора
// мегабайт при показе в триста пикселей.
export async function optimizeCatalogImages(db: Db): Promise<void> {
  if (!isStorageConfigured) return
  const done = await db.query.settings.findFirst({ where: eq(settings.key, FLAG) })
  if (done) return

  let saved = 0
  let count = 0

  const shrink = async (key: string, width: number, suffix: string): Promise<string | null> => {
    if (!key.endsWith('.png')) return null
    try {
      const original = await getObject(key)
      const small = await toJpeg(original, width)
      const next = key.replace(/\.png$/, `${suffix}.jpg`)
      await uploadObject(next, small, 'image/jpeg')
      saved += original.length - small.length
      count += 1
      return next
    } catch (error) {
      console.error(`[optimize] ${key}: ${String(error)}`)
      return null
    }
  }

  const books = await db.select().from(products).where(eq(products.kind, 'book'))
  for (const book of books) {
    if (book.previewKey) {
      const next = await shrink(book.previewKey, COVER_WIDTH, '-640')
      if (next) {
        await db
          .update(products)
          .set({ previewKey: next, updatedAt: new Date() })
          .where(eq(products.id, book.id))
      }
    }

    const pages = await db
      .select()
      .from(productPages)
      .where(and(eq(productPages.productId, book.id), isNotNull(productPages.approvedSampleKey)))

    for (const page of pages) {
      const next = await shrink(page.approvedSampleKey as string, PAGE_WIDTH, '-900')
      if (next) {
        await db
          .update(productPages)
          .set({ approvedSampleKey: next, sampleKey: next, updatedAt: new Date() })
          .where(eq(productPages.id, page.id))
      }
    }
  }

  if (count === 0) return
  await db
    .insert(settings)
    .values({ key: FLAG, value: `${count}` })
    .onConflictDoNothing()
  console.log(
    `[optimize] пережато ${count} картинок, экономия ${(saved / 1024 / 1024).toFixed(1)} МБ`,
  )
}
