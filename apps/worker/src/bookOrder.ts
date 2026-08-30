import { asc, eq } from 'drizzle-orm'
import { createDb, productPages, products, stories, storyPages } from '@kidsstory/db'
import { buildBookPagePrompt, renderBookPdf, zoneForPage } from '@kidsstory/book'
import type { BookPage } from '@kidsstory/book'
import {
  hasNamePlaceholder,
  renderVoiceoverText,
  resultExpiryFrom,
  type ChildGender,
} from '@kidsstory/shared'
import { getObject, isStorageConfigured, uploadObject } from '@kidsstory/storage'
import { buildFrameFromRefs, bytesToDataUri, downloadBytes, photoDataUri } from './fal.js'
import { generateVoiceover } from './elevenlabs.js'
import { OrderFailedError } from './productOrder.js'

type Db = ReturnType<typeof createDb>
type Page = typeof productPages.$inferSelect

const PAGE_ATTEMPTS = 3

async function withRetries<T>(label: string, attempts: number, task: () => Promise<T>): Promise<T> {
  let last: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      last = error
      console.warn(`[book] ${label}: попытка ${attempt}/${attempts} - ${String(error)}`)
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 5000 * attempt))
    }
  }
  throw last instanceof Error ? last : new Error(String(last))
}

// Тот же принцип, что и в видео: героя ведёт утверждённый на кастинге портрет,
// иначе ребёнок меняется от страницы к странице.
async function heroReferences(chosenCastingKey: string | null, photoPath: string): Promise<string[]> {
  const refs: string[] = []
  if (chosenCastingKey) {
    try {
      refs.push(bytesToDataUri(await getObject(chosenCastingKey)))
    } catch (error) {
      console.warn(`[book] утверждённый портрет недоступен: ${String(error)}`)
    }
  }
  refs.push(await photoDataUri(photoPath))
  return refs
}

function pageText(page: Page, childName: string, gender: ChildGender): string {
  const raw = gender === 'female' && page.textFemale?.trim() ? page.textFemale : page.text
  return hasNamePlaceholder(raw) ? renderVoiceoverText(raw, childName, gender) : raw
}

function pagePrompt(page: Page, gender: ChildGender): string {
  return gender === 'female' && page.promptFemale?.trim() ? page.promptFemale : page.prompt
}

async function renderPageImage(
  db: Db,
  storyId: string,
  page: Page,
  index: number,
  gender: ChildGender,
  heroRefs: string[],
): Promise<string> {
  const existing = await db.query.storyPages.findFirst({
    where: eq(storyPages.pageId, page.id),
  })
  if (existing?.status === 'ready' && existing.imageKey) return existing.imageKey

  await db
    .update(storyPages)
    .set({ status: 'rendering', attempts: (existing?.attempts ?? 0) + 1, updatedAt: new Date() })
    .where(eq(storyPages.pageId, page.id))

  const prompt = buildBookPagePrompt(pagePrompt(page, gender), zoneForPage(index))
  const url = await withRetries(`страница ${page.position}`, PAGE_ATTEMPTS, () =>
    buildFrameFromRefs(heroRefs, prompt, 'square'),
  )
  const key = `orders/${storyId}/page-${page.position}.png`
  await uploadObject(key, await downloadBytes(url), 'image/png')
  await db
    .update(storyPages)
    .set({ status: 'ready', imageKey: key, failReason: null, updatedAt: new Date() })
    .where(eq(storyPages.pageId, page.id))
  return key
}

export async function assembleBookOrder(db: Db, storyId: string): Promise<void> {
  if (!isStorageConfigured) throw new OrderFailedError('S3 не настроен - сборка невозможна', true)

  const story = await db.query.stories.findFirst({ where: eq(stories.id, storyId) })
  if (!story) throw new OrderFailedError(`заказ ${storyId} не найден`, true)
  if (!story.productId) throw new OrderFailedError(`у заказа ${storyId} нет продукта`, true)
  if (!story.photoPath) throw new OrderFailedError('к заказу не приложено фото ребёнка', true)

  const childName = story.childName?.trim() ?? ''
  const gender: ChildGender = story.gender === 'female' ? 'female' : 'male'

  const product = await db.query.products.findFirst({ where: eq(products.id, story.productId) })
  if (!product) throw new OrderFailedError('продукт заказа удалён', true)

  const pages = await db
    .select()
    .from(productPages)
    .where(eq(productPages.productId, product.id))
    .orderBy(asc(productPages.position))
  if (pages.length === 0) throw new OrderFailedError('у книги нет страниц', true)
  if (!childName && pages.some((p) => hasNamePlaceholder(p.text))) {
    throw new OrderFailedError('в заказе нет имени ребёнка, а текст персональный', true)
  }

  for (const page of pages) {
    await db
      .insert(storyPages)
      .values({ storyId, pageId: page.id, position: page.position })
      .onConflictDoNothing()
  }

  const heroRefs = await heroReferences(story.chosenCastingKey, story.photoPath)
  console.log(
    `[book] ${storyId}: героя ведём по ${story.chosenCastingKey ? 'утверждённому портрету' : 'исходному фото'}`,
  )

  const bookPages: BookPage[] = []
  for (const [index, page] of pages.entries()) {
    console.log(`[book] ${storyId}: страница ${index + 1} из ${pages.length}`)
    const key = await renderPageImage(db, storyId, page, index, gender, heroRefs)
    bookPages.push({
      text: pageText(page, childName, gender),
      image: Buffer.from(await getObject(key)),
    })
  }

  console.log(`[book] ${storyId}: собираю PDF`)
  const pdf = await renderBookPdf({
    title: product.title,
    childName: childName || 'малыша',
    coverImage: bookPages[0]?.image,
    pages: bookPages,
  })
  const pdfKey = `orders/${storyId}/book.pdf`
  await uploadObject(pdfKey, pdf, 'application/pdf')

  console.log(`[book] ${storyId}: озвучка`)
  const narration = bookPages.map((p) => p.text).join('\n\n')
  const audioKey = `orders/${storyId}/book.mp3`
  await uploadObject(audioKey, await generateVoiceover(narration), 'audio/mpeg')

  await db
    .update(stories)
    .set({
      status: 'ready',
      pdfKey,
      audioKey,
      resultKey: pdfKey,
      expiresAt: resultExpiryFrom(new Date()),
      failReason: null,
      updatedAt: new Date(),
    })
    .where(eq(stories.id, storyId))
  console.log(`[book] ${storyId}: книга готова`)
}
