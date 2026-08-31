import { and, asc, eq, isNull } from 'drizzle-orm'
import { createDb, productPages, products, settings } from '@kidsstory/db'
import { buildBookCoverPrompt, buildBookPagePrompt, zoneForPage } from '@kidsstory/book'
import { isStorageConfigured, uploadObject } from '@kidsstory/storage'
import { buildReelFirstFrame, downloadBytes } from './fal.js'

type Db = ReturnType<typeof createDb>

const FLAG = 'book_samples_seeded'
// В карточке товара показываются первые четыре утверждённые страницы, поэтому
// на витрину рисуем ровно их, а не всю книгу: остальное admin добьёт при желании.
const PAGES_PER_BOOK = 4

// Разовый посев образцов страниц для витрины. Без картинок карточка книги
// выглядит пустой, а продавать пустую карточку нельзя. Флаг в settings
// гарантирует, что генерация не повторится при следующих перезапусках.
export async function seedBookSamples(db: Db): Promise<void> {
  if (!isStorageConfigured) return

  const done = await db.query.settings.findFirst({ where: eq(settings.key, FLAG) })
  if (done) return

  const photo = await db.query.settings.findFirst({
    where: eq(settings.key, 'sample_child_photo'),
  })
  if (!photo?.value) {
    console.warn('[seed] нет тестового фото ребёнка - образцы витрины не рисую')
    return
  }

  const books = await db.select().from(products).where(eq(products.kind, 'book'))
  if (books.length === 0) return

  let drawn = 0
  let failed = 0

  for (const book of books) {
    const pages = await db
      .select()
      .from(productPages)
      .where(and(eq(productPages.productId, book.id), isNull(productPages.approvedSampleKey)))
      .orderBy(asc(productPages.position))

    for (const page of pages.slice(0, PAGES_PER_BOOK)) {
      if (!page.prompt.trim()) continue
      try {
        const prompt = buildBookPagePrompt(page.prompt, zoneForPage(page.position - 1))
        const url = await buildReelFirstFrame([photo.value], prompt, 'square')
        const key = `products/${book.id}/page-${page.id}.png`
        await uploadObject(key, await downloadBytes(url), 'image/png')
        await db
          .update(productPages)
          .set({
            sampleKey: key,
            approvedSampleKey: key,
            sampleStatus: 'ready',
            approvedAt: new Date(),
            failReason: null,
            updatedAt: new Date(),
          })
          .where(eq(productPages.id, page.id))
        drawn += 1
        console.log(`[seed] ${book.slug}: страница ${page.position} готова`)
      } catch (error) {
        failed += 1
        console.error(`[seed] ${book.slug}: страница ${page.position} - ${String(error)}`)
      }
    }

    // Обложка рисуется отдельным кадром по канону плаката, а не берётся с
    // первой страницы: у страницы верх намеренно пустой под текст.
    if (!book.previewKey && book.coverPrompt) {
      try {
        const prompt = buildBookCoverPrompt(book.coverPrompt, book.coverMood ?? 'warm and hopeful')
        const url = await buildReelFirstFrame([photo.value], prompt, 'square')
        const key = `products/${book.id}/cover.png`
        await uploadObject(key, await downloadBytes(url), 'image/png')
        await db
          .update(products)
          .set({ previewKey: key, updatedAt: new Date() })
          .where(eq(products.id, book.id))
        drawn += 1
        console.log(`[seed] ${book.slug}: обложка готова`)
      } catch (error) {
        failed += 1
        console.error(`[seed] ${book.slug}: обложка - ${String(error)}`)
      }
    }
  }

  if (drawn === 0) {
    console.warn('[seed] ни одной страницы нарисовать не удалось - повторю при следующем старте')
    return
  }

  await db
    .insert(settings)
    .values({ key: FLAG, value: `${drawn}` })
    .onConflictDoNothing()
  console.log(`[seed] образцы витрины готовы: нарисовано ${drawn}, с ошибкой ${failed}`)
}
