import { eq } from 'drizzle-orm'
import { productScenes, products } from '@kidsstory/db'
import { db } from '../context.js'

const SLUG = 'teeth-pilot'

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
      'Calm night sky full of scattered stars, a warm golden spark drifts in from the side and slowly blooms into a soft glow in the centre of frame, empty space left for a title card, very slow drifting camera',
    voiceoverText: '[warmly] Киномалыш представляет… историю про Тёму.',
  },
  {
    kind: 'library',
    title: 'Знакомство',
    prompt:
      'Cozy little bathroom in the evening, warm night lamp glow, fogged mirror, a cup with a toothbrush on the sink, stars lighting up in the window behind, no people in frame, gentle slow push-in',
    voiceoverText:
      'Наступил вечер. Звёздочки зажглись за окном, и в маленькой уютной ванной началось самое нелюбимое время Тёмы — чистить зубы.',
  },
  {
    kind: 'hero',
    title: 'Чувство',
    prompt:
      'Little boy in a striped top holds a toothbrush behind his back, sighs heavily with drooping shoulders, glances sideways hoping to slip away and play, warm evening light, softly blurred home interior behind him',
    voiceoverText:
      'Тёме казалось, что это долго и скучно. Он вздыхал, прятал щётку за спину и думал: вот бы убежать играть! [curious] Тебе тоже так бывает?',
  },
  {
    kind: 'library',
    title: 'Зов',
    prompt:
      'Close-up of a toothbrush standing in a cup, it starts to shimmer with warm golden light, tiny sparkles swirl around the bristles, no people in frame, slow gentle zoom',
    voiceoverText:
      '[whispers] Вдруг щётка тихонько засветилась. Дзинь-дилинь! [excited] Кажется, она хочет проснуться. Позови её! Скажи громко: щёточка, просыпайся!',
  },
  {
    kind: 'hero',
    title: 'Поворот',
    prompt:
      'The toothbrush in the little boy\'s hand bursts into warm golden light, the boy gasps in amazement, huge eyes wide open, pure delight spreading across his face, sparkles reflecting in his eyes',
    voiceoverText:
      '[whispers] И щётка проснулась! «Здравствуй, Тёма! Я не простая, я волшебная. А ты сегодня мой храбрый помощник.» [warmly] Чистим зубки, Тёма, — и улыбка ярче звёздочки!',
  },
  {
    kind: 'library',
    title: 'Шалуны',
    prompt:
      'Extreme close-up inside a mouth, face not visible: tiny cute round sugar goblins with big eyes and funny little caps hop and dance in a ring between the white teeth, mischievous and playful, soft glow',
    voiceoverText:
      '[playfully] Щётка посветила — ой-ой-ой! На зубах у Тёмы поселились сахарные шалуны. Днём они грызут сладкие крошки, а вечером водят хороводы и совсем не хотят уходить.',
  },
  {
    kind: 'hero',
    title: 'Решимость',
    prompt:
      'Little boy hesitates for a moment, then grips the glowing magic toothbrush tightly with both hands, chin lifted, brave determined look in his eyes, warm rim light',
    voiceoverText:
      '«Поможешь навести порядок?» — спросила щётка. Тёма сомневался… а потом крепко-крепко сжал её в руке. Ведь помощники не отступают!',
  },
  {
    kind: 'hero',
    title: 'Заклинание чистоты',
    prompt:
      'Little boy brushing his teeth with focus and joy, the glowing toothbrush leaves a golden trail in the air, clear readable up-down strokes and little circles, sparkling foam, cheerful energy',
    voiceoverText:
      '[excited] Тогда щётка запела волшебное заклинание чистоты. Повторяй за мной! Вверх-вниз, вжик-вжик, кружок-кружок, влево-вправо — чисто!',
  },
  {
    kind: 'library',
    title: 'Магия',
    prompt:
      'Golden sparks swirl in a warm vortex through the little bathroom, glowing light washes over tiles and mirror, no people in frame, smooth circular camera movement',
    voiceoverText: '',
  },
  {
    kind: 'hero',
    title: 'Кульминация',
    prompt:
      'Little boy raises the glowing toothbrush high like a magic wand and swings it cheerfully, the tiny sugar goblins scatter laughing and burst into golden sparkles around him, triumphant joyful moment',
    voiceoverText:
      '[excited] Тёма поднял щётку высоко-высоко — и вжух-вжух-вжух! — весёлые шалуны закружились, засмеялись и рассыпались золотыми искорками. Ура! Получилось!',
  },
  {
    kind: 'library',
    title: 'Чистые зубы',
    prompt:
      'Extreme close-up inside a mouth, face not visible: perfectly white shining teeth, a star-shaped sparkle runs across the enamel, last golden specks melting away, no goblins left',
    voiceoverText:
      'Зубки засверкали, как звёздочки в ночном небе, и тихонько сказали: спасибо, Тёма!',
  },
  {
    kind: 'hero',
    title: 'Тепло',
    prompt:
      'Little boy looks into a mirror and beams with a bright clean smile, rosy cheeks, proud shining eyes, rising slightly on his tiptoes, warm cozy evening light',
    voiceoverText:
      '[warmly] Тёма посмотрел в зеркало — и улыбнулся. И улыбка вышла самой яркой на свете. Потому что он справился сам.',
  },
  {
    kind: 'hero',
    title: 'Тихий повтор',
    prompt:
      'Softer bluish night light, calm little boy brushing his teeth again slowly and gently, unhurried flowing movements, eyelids growing heavy, golden sparkles settling down like snowflakes around him',
    voiceoverText:
      '[whispers] «А теперь ещё разок, — шепнула щётка, — только тихо-тихо. Как будто укладываем зубки спать.» Вверх-вниз… вжик-вжик… кружок-кружок… влево-вправо… чисто.',
  },
  {
    kind: 'hero',
    title: 'Мораль',
    prompt:
      'Little boy places the toothbrush back into the cup and pats it goodbye, the brush blinks with a small golden glow in answer, the boy yawns and smiles sleepily, soft warm night light',
    voiceoverText:
      'Вот и всё. Оказывается, даже самое обычное дело становится волшебным, если делать его с улыбкой. Чистим зубки, Тёма, — и улыбка ярче звёздочки! Запомни: чищу утром, чищу днём, чистим зубки перед сном!',
  },
  {
    kind: 'library',
    title: 'Укладка',
    prompt:
      'A glowing star-shaped tooth floats gently among golden stars across a calm night sky, slowly dissolving into warm light, no people in frame, very slow dreamy camera drift',
    voiceoverText:
      '[warmly] С того вечера Тёма чистит зубы каждый день. Спокойной ночи, Тёма. Пусть твоя улыбка светит ярко, как звёзды.',
  },
  {
    kind: 'title',
    title: 'Финальные титры',
    prompt:
      'Warm calm starry background with slow floating golden specks, plenty of empty space for end credit lines, minimal motion',
    voiceoverText: 'В главной роли — Тёма.',
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
          title: 'Тёма и волшебная щётка',
          tagline: 'Пилотный товарный ролик · чистка зубов',
          status: 'active',
        })
        .returning()
    )[0]

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
      updatedAt: new Date(),
    }
    const current = byPosition.get(position)
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
