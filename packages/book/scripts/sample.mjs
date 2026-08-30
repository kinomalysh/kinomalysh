import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildBookPagePrompt, renderBookPdf, zoneForPage } from '../dist/index.js'

const OUT_DIR = path.resolve('packages/book/sample')
const ENV_PATH = path.resolve('apps/worker/.env')

const STORY = {
  title: 'Тёма и ночные огоньки',
  childName: 'Тёмы',
  cover: 'a cosy dark childrens bedroom at night seen from the doorway, one tiny warm golden light glowing near the pillow of a small bed, deep indigo shadows, soft moonlight through the window',
  pages: [
    {
      text: 'Когда мама выключала свет, комната Тёмы становилась тёмной-претёмной. И Тёме было чуточку страшно.',
      scene: 'a small blonde toddler boy lying in bed in a dark bedroom just after the light was switched off, wide eyes, deep indigo shadows, faint moonlight from the window',
    },
    {
      text: 'В углу что-то темнело, и казалось - там кто-то прячется. Тёма натянул одеяло до самого носа.',
      scene: 'the same small blonde toddler boy pulling a blanket up to his nose, glancing sideways at a dark corner of the bedroom where a vague shadow shape looms, cosy but tense mood',
    },
    {
      text: 'И вдруг у подушки зажёгся маленький тёплый огонёк. «Не бойся, Тёма, - сказал он. - Темнота совсем не злая. Хочешь, покажу?»',
      scene: 'a tiny glowing golden spark character with a friendly face hovering just above the pillow next to the surprised toddler boy, warm golden light spilling across the bedding',
    },
    {
      text: 'Огонёк подлетел к тёмному углу - и там оказался не кто-то страшный, а любимая пушистая куртка на стуле. Тёма тихонько засмеялся.',
      scene: 'the tiny glowing golden spark lighting up a dark corner revealing a fluffy jacket hanging on a chair, the toddler boy sitting up in bed laughing with relief',
    },
    {
      text: 'Тёма сам протянул руку к темноте - и по всей комнате закружились тёплые огоньки, как звёздочки дома.',
      scene: 'the toddler boy reaching out his hand while dozens of tiny warm golden lights swirl around the whole bedroom like indoor stars, magical and joyful',
    },
    {
      text: 'Темнота - это просто время, когда отдыхают глазки. А если станет страшно, вспомни: твой огонёк всегда с тобой. Спокойной ночи, Тёма.',
      scene: 'the toddler boy peacefully asleep in bed with a serene smile, one tiny golden light resting on the pillow beside him, calm indigo night room',
    },
  ],
}

async function falKey() {
  const raw = await readFile(ENV_PATH, 'utf8')
  const line = raw.split('\n').find((l) => l.startsWith('FAL_KEY='))
  if (!line) throw new Error('FAL_KEY не найден в apps/worker/.env')
  return line.slice('FAL_KEY='.length).trim()
}

async function generateImage(key, prompt, file) {
  const res = await fetch('https://fal.run/fal-ai/nano-banana-2', {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image_size: 'square_hd', num_images: 1 }),
  })
  if (!res.ok) throw new Error(`fal ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const body = await res.json()
  const url = body.images?.[0]?.url
  if (!url) throw new Error('fal вернул ответ без картинки')
  const bytes = Buffer.from(await (await fetch(url)).arrayBuffer())
  await writeFile(file, bytes)
  return file
}

const key = process.env.REUSE_IMAGES === '1' ? '' : await falKey()
await mkdir(OUT_DIR, { recursive: true })

const REUSE = process.env.REUSE_IMAGES === '1'
const coverFile = path.join(OUT_DIR, 'cover.png')
if (!REUSE) {
  console.log('Рисую обложку')
  await generateImage(key, buildBookPagePrompt(STORY.cover, 'bottom'), coverFile)
}

const pages = []
for (const [i, page] of STORY.pages.entries()) {
  const file = path.join(OUT_DIR, `page-${i + 1}.png`)
  if (!REUSE) {
    console.log(`Рисую страницу ${i + 1} из ${STORY.pages.length}`)
    await generateImage(key, buildBookPagePrompt(page.scene, zoneForPage(i)), file)
  }
  pages.push({ text: page.text, image: file })
}

console.log('Собираю PDF')
const pdf = await renderBookPdf({
  title: STORY.title,
  childName: STORY.childName,
  coverImage: coverFile,
  pages,
})
const pdfPath = path.join(OUT_DIR, 'kinomalysh-sample.pdf')
await writeFile(pdfPath, pdf)
console.log(`Готово: ${pdfPath} (${(pdf.length / 1024 / 1024).toFixed(1)} МБ)`)
