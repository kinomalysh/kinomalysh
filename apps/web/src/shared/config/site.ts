import { SEO_PAGES } from '../../entities/seo-page/model'
import { BLOG_POSTS } from '../../entities/blog/model'

declare const __SITE_URL__: string | undefined

const configuredUrl =
  typeof __SITE_URL__ !== 'undefined'
    ? __SITE_URL__
    : globalThis.process?.env?.VITE_SITE_URL

export const SITE_URL = (configuredUrl ?? 'https://kinomalysh.ru').replace(/\/$/, '')

export const siteConfig = {
  name: 'Киномалыш',
  url: SITE_URL,
  title: 'Киномалыш — мультфильм по фото ребёнка за 15 минут',
  description:
    'Загрузите одно фото — нейросеть создаст персональный мультфильм, где ваш ребёнок главный герой. Готово за 15 минут, 1 990 ₽. Книга с озвучкой — 250 ₽.',
  shortDescription: 'Персональный мультфильм по фото ребёнка за 15 минут',
  locale: 'ru_RU',
  ogImage: '/og-cover.jpg',
  keywords: [
    'мультик с лицом ребёнка',
    'персональный мультфильм по фото',
    'мультфильм с ребёнком в главной роли',
    'нейросеть мультик по фото ребёнка',
    'сказка по фото ребёнка',
    'персональная сказка для ребёнка',
    'книга где ребёнок главный герой',
    'именной подарок ребёнку',
    'ИИ сказка для ребёнка',
    'мультфильм в подарок на день рождения',
  ],
  price: {
    video: 1990,
    videoPremium: 3490,
    book: 250,
    family: 5990,
  },
  facts: [
    'Персональный мультфильм на 2 минуты по одному фото ребёнка — 1 990 ₽, готов за 15 минут.',
    'Книга с иллюстрациями и озвучкой — 250 ₽.',
    'Супергеройский мультфильм — 3 490 ₽, семейный набор 3+1 — 5 990 ₽.',
    'Кастинг героя бесплатный: до оплаты показываем три портрета и кадры будущих сцен, можно просить ещё.',
    'Фото используется только для вашей сказки и автоматически удаляется через неделю.',
    'Сюжеты написаны заранее и проверены редактором — маркировка 0+.',
    'Студийные персональные мультфильмы на рынке стоят 12 700–14 300 ₽ и делаются 2–7 дней; печатные именные книги — 5–14 дней.',
  ],
  contentDate: '2026-07-19',
  contacts: {
    telegram: 'https://t.me/kinomalysh_help',
  },
} as const

export interface SeoMeta {
  title: string
  description: string
  path: string
  noindex?: boolean
}

export const SEO: Record<string, SeoMeta> = {
  home: {
    path: '/',
    title: siteConfig.title,
    description: siteConfig.description,
  },
  create: {
    path: '/create',
    title: 'Создать мультфильм по фото ребёнка — Киномалыш',
    description:
      'Загрузите фото, выберите сюжет и получите персональный мультфильм с вашим ребёнком в главной роли за 15 минут.',
  },
  library: {
    path: '/library',
    title: 'Моя библиотека сказок — Киномалыш',
    description: 'Все ваши персональные мультфильмы и книги в одном месте.',
    noindex: true,
  },
  story: {
    path: '/story',
    title: 'Сказка — Киномалыш',
    description: 'Персональная сказка, где ваш ребёнок главный герой.',
    noindex: true,
  },
  profile: {
    path: '/profile',
    title: 'Профиль — Киномалыш',
    description: 'Баланс, сертификаты и история заказов.',
    noindex: true,
  },
  terms: {
    path: '/terms',
    title: 'Пользовательское соглашение — Киномалыш',
    description: 'Условия использования сервиса персональных сказок «Киномалыш».',
  },
  privacy: {
    path: '/privacy',
    title: 'Политика конфиденциальности — Киномалыш',
    description:
      'Как «Киномалыш» обрабатывает фотографии и персональные данные: хранение, удаление, права пользователя.',
  },
}

export const BLOG_INDEX: SeoMeta = {
  path: '/blog',
  title: 'Блог Огонька — о детских сказках, подарках и нейросетях',
  description:
    'Статьи о персональных сказках и мультфильмах: как выбрать подарок, что делать со страхом темноты и долгим засыпанием, безопасно ли загружать фото ребёнка.',
}

export const PAGE_META: SeoMeta[] = [
  ...Object.values(SEO),
  ...SEO_PAGES.map((page) => ({
    path: `/${page.slug}`,
    title: page.title,
    description: page.description,
  })),
  BLOG_INDEX,
  ...BLOG_POSTS.map((post) => ({
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.description,
  })),
]

export const INDEXABLE_PATHS = PAGE_META.filter((page) => !page.noindex).map((page) => page.path)
