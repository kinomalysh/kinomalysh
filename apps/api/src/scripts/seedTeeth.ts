import { eq } from 'drizzle-orm'
import { productScenes, products } from '@kidsstory/db'
import { db } from '../context.js'

const SLUG = 'teeth-pilot'
const TITLE = 'Волшебная щётка'
const TAGLINE = 'Пилотный товарный ролик · чистка зубов'

interface SeedScene {
  kind: 'hero' | 'library' | 'title'
  title: string
  prompt: string
  voiceoverText: string
}

const SCENES: SeedScene[] = [
  {
    kind: 'title',
    title: 'Вступительный титр',
    prompt:
      'A single golden spark drifts across a calm night sky and slowly blooms into a soft glow in the centre of the frame, stars twinkling around it, wide open space left in the middle, camera drifts slowly forward',
    voiceoverText: '[warmly] Киномалыш представляет… историю про {имя:вин}.',
  },
  {
    kind: 'library',
    title: 'Знакомство',
    prompt:
      'A warm night lamp lights up above a small washbasin, the glow spreading over pale tiles, a cup with a toothbrush waiting beside a fogged mirror, stars switching on in the window behind, no people in frame, camera slowly pushes in',
    voiceoverText:
      'Наступил вечер. Звёздочки зажглись за окном, и в маленькой уютной ванной началось самое нелюбимое время {имя:род} - чистить зубы.',
  },
  {
    kind: 'hero',
    title: 'Чувство',
    prompt:
      'A little boy in a striped top hides a toothbrush behind his back and sighs heavily, his shoulders dropping, his eyes glancing sideways towards the door, warm evening light, softly blurred home interior behind him, camera holds close on him',
    voiceoverText:
      '{имя:дат} казалось, что это долго и скучно. Он вздыхал, прятал щётку за спину и думал: вот бы убежать играть! [curious] Тебе тоже так бывает?',
  },
  {
    kind: 'library',
    title: 'Зов',
    prompt:
      'A toothbrush standing in a cup starts to glow, warm golden light pulsing along the bristles as tiny sparkles spiral around it, no people in frame, camera slowly zooms in',
    voiceoverText:
      '[whispers] Вдруг щётка тихонько засветилась. Дзинь-дилинь! [excited] Кажется, она хочет проснуться. Позови её! Скажи громко: щёточка, просыпайся!',
  },
  {
    kind: 'hero',
    title: 'Поворот',
    prompt:
      'A little boy watches the toothbrush in his hand burst into golden light, his eyes widening in amazement, a delighted smile spreading across his face, sparkles reflecting in his eyes, camera slowly pushes in on his face',
    voiceoverText:
      '[whispers] И щётка проснулась! «Здравствуй, {имя}! Я не простая, я волшебная. А ты сегодня мой храбрый помощник.» [warmly] Чистим зубки, {имя}, - и улыбка ярче звёздочки!',
  },
  {
    kind: 'library',
    title: 'Шалуны',
    prompt:
      'Tiny round sugar goblins in funny caps hop and dance in a ring between big white teeth, giggling and tumbling over each other, extreme close-up inside a mouth with no face visible, soft glow, camera tracks slowly sideways',
    voiceoverText:
      '[playfully] Щётка посветила - ой-ой-ой! На зубах у {имя:род} поселились сахарные шалуны. Днём они грызут сладкие крошки, а вечером водят хороводы и совсем не хотят уходить.',
  },
  {
    kind: 'hero',
    title: 'Решимость',
    prompt:
      'A little boy hesitates for a moment, then grips the glowing toothbrush tightly with both hands and lifts his chin, a brave determined look settling on his face, warm rim light, camera slowly rises to his eye level',
    voiceoverText:
      '«Поможешь навести порядок?» - спросила щётка. {имя} сомневался… а потом крепко-крепко сжал её в руке. Ведь помощники не отступают!',
  },
  {
    kind: 'hero',
    title: 'Заклинание чистоты',
    prompt:
      'A little boy brushes his teeth with big cheerful strokes, the glowing toothbrush leaving golden trails in the air, clear up-down strokes and little circles, sparkling foam, camera stays steady in a medium shot',
    voiceoverText:
      '[excited] Тогда щётка запела волшебное заклинание чистоты. Повторяй за мной! Вверх-вниз, вжик-вжик, кружок-кружок, влево-вправо - чисто!',
  },
  {
    kind: 'library',
    title: 'Магия',
    prompt:
      'Golden sparks swirl upward in a warm vortex through a small tiled corner of a home, the light washing over pale tiles and the mirror above the washbasin, no people in frame, camera circles smoothly around the glow',
    voiceoverText: '',
  },
  {
    kind: 'hero',
    title: 'Кульминация',
    prompt:
      'A little boy raises the glowing toothbrush high like a wand and swings it, and the tiny sugar goblins scatter laughing and burst into golden sparkles around him, triumphant joyful moment, camera pulls back a little to catch the burst',
    voiceoverText:
      '[excited] {имя} поднял щётку высоко-высоко - и вжух-вжух-вжух! - весёлые шалуны закружились, засмеялись и рассыпались золотыми искорками. Ура! Получилось!',
  },
  {
    kind: 'library',
    title: 'Чистые зубы',
    prompt:
      'A star-shaped sparkle runs across a row of perfectly white teeth as the last golden specks melt away, extreme close-up inside a mouth with no face visible, camera drifts slowly along the teeth',
    voiceoverText:
      'Зубки засверкали, как звёздочки в ночном небе, и тихонько сказали: спасибо, {имя}!',
  },
  {
    kind: 'hero',
    title: 'Тепло',
    prompt:
      'A little boy looks into a mirror and beams with a bright clean smile, rosy cheeks and proud shining eyes, rising slightly on his tiptoes, warm cosy evening light, camera holds a close mirror shot',
    voiceoverText:
      '[warmly] {имя} посмотрел в зеркало - и улыбнулся. И улыбка вышла самой яркой на свете. Потому что он справился сам.',
  },
  {
    kind: 'hero',
    title: 'Тихий повтор',
    prompt:
      'A sleepy little boy brushes his teeth again, slowly and gently this time, his movements unhurried and his eyelids growing heavy, golden sparkles settling around him like snowflakes, soft bluish night light, camera drifts in very slowly',
    voiceoverText:
      '[whispers] «А теперь ещё разок, - шепнула щётка, - только тихо-тихо. Как будто укладываем зубки спать.» Вверх-вниз… вжик-вжик… кружок-кружок… влево-вправо… чисто.',
  },
  {
    kind: 'hero',
    title: 'Мораль',
    prompt:
      'A little boy puts the toothbrush back into the cup and pats it goodbye, the brush blinking with a small golden glow in answer, the boy yawning and smiling sleepily, soft warm night light, camera holds steady in a medium close-up',
    voiceoverText:
      'Вот и всё. Оказывается, даже самое обычное дело становится волшебным, если делать его с улыбкой. Чистим зубки, {имя}, - и улыбка ярче звёздочки! Запомни: чищу утром, чищу днём, чистим зубки перед сном!',
  },
  {
    kind: 'library',
    title: 'Укладка',
    prompt:
      'A glowing star-shaped tooth floats gently among golden stars across a calm night sky, slowly dissolving into warm light, no people in frame, camera drifts upward very slowly',
    voiceoverText:
      '[warmly] С того вечера {имя} чистит зубы каждый день. Спокойной ночи, {имя}. Пусть твоя улыбка светит ярко, как звёзды.',
  },
  {
    kind: 'title',
    title: 'Финальные титры',
    prompt:
      'Golden specks float slowly across a warm starry background, drifting apart to leave open space for the end credits, camera almost still',
    voiceoverText: 'В главной роли - {имя}.',
  },
]

async function main() {
  const existing = await db.query.products.findFirst({ where: eq(products.slug, SLUG) })
  const product =
    existing ??
    (
      await db
        .insert(products)
        .values({
          slug: SLUG,
          title: TITLE,
          tagline: TAGLINE,
          status: 'draft',
        })
        .returning()
    )[0]

  if (existing) {
    await db
      .update(products)
      .set({ title: TITLE, tagline: TAGLINE, updatedAt: new Date() })
      .where(eq(products.id, product.id))
  }

  const saved = await db.query.productScenes.findMany({
    where: eq(productScenes.productId, product.id),
  })
  const byPosition = new Map(saved.map((s) => [s.position, s]))

  for (const [index, scene] of SCENES.entries()) {
    const position = index + 1
    const values = {
      kind: scene.kind,
      title: scene.title,
      prompt: scene.prompt,
      voiceoverText: scene.voiceoverText || null,
      failReason: null,
      updatedAt: new Date(),
    }
    const current = byPosition.get(position)
    if (current && current.prompt !== scene.prompt) {
      Object.assign(values, {
        approvedAt: null,
        clipKey: null,
        clipUrl: null,
        frameUrl: null,
        clipStatus: 'idle',
      })
    }
    if (current && current.voiceoverText !== (scene.voiceoverText || null)) {
      Object.assign(values, { approvedAt: null, voKey: null, voStatus: 'idle' })
    }
    if (current) {
      await db.update(productScenes).set(values).where(eq(productScenes.id, current.id))
    } else {
      await db.insert(productScenes).values({ productId: product.id, position, ...values })
    }
  }

  const verb = existing ? 'Обновлён' : 'Засеян'
  console.log(`${verb} продукт «${product.title}»: ${SCENES.length} сцен`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
