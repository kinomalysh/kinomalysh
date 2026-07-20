import type { Plugin } from 'vite'
import { INDEXABLE_PATHS, PAGE_META, siteConfig } from './src/shared/config/site'
import { FAQ } from './src/shared/config/faq'
import { PLOTS } from '../../packages/shared/src/plots'
import { PACKS } from '../../packages/shared/src/pricing'
import { BLOG_POSTS } from './src/entities/blog/model'

const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'Claude-Web',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'cohere-ai',
  'Meta-ExternalAgent',
  'YandexAdditional',
]

const SCRAPERS = ['Bytespider', 'PetalBot', 'Diffbot', 'ImagesiftBot']

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'yclid',
  'ysclid',
  'gclid',
  'fbclid',
  '_openstat',
  'ref',
  'from',
]

const PRIVATE_PATHS = ['/profile', '/library', '/story/', '/auth', '/api/']

function buildRobotsTxt(url: string): string {
  return [
    'User-agent: *',
    'Allow: /',
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    '',
    ...AI_BOTS.map((bot) => `User-agent: ${bot}`),
    'Allow: /',
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    '',
    ...SCRAPERS.map((bot) => `User-agent: ${bot}`),
    'Disallow: /',
    '',
    'User-agent: Yandex',
    'Allow: /',
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    `Clean-param: ${TRACKING_PARAMS.join('&')} /`,
    '',
    `Sitemap: ${url}/sitemap.xml`,
    '',
  ].join('\n')
}

function lastmodFor(path: string): string {
  const post = BLOG_POSTS.find((p) => `/blog/${p.slug}` === path)
  return post?.published ?? siteConfig.contentDate
}

function priorityFor(path: string): string {
  if (path === '/') return '1.0'
  if (path === '/create') return '0.9'
  if (path === '/blog') return '0.6'
  if (path.startsWith('/blog/')) return '0.5'
  if (path === '/terms' || path === '/privacy') return '0.2'
  return '0.7'
}

function changefreqFor(path: string): string {
  if (path === '/' || path === '/blog') return 'weekly'
  if (path === '/terms' || path === '/privacy') return 'yearly'
  return 'monthly'
}

function buildSitemap(url: string): string {
  const entries = INDEXABLE_PATHS.map((path) => {
    return [
      '  <url>',
      `    <loc>${url}${path === '/' ? '/' : path}</loc>`,
      `    <lastmod>${lastmodFor(path)}</lastmod>`,
      `    <changefreq>${changefreqFor(path)}</changefreq>`,
      `    <priority>${priorityFor(path)}</priority>`,
      '  </url>',
    ].join('\n')
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')
}

function buildLlmsTxt(url: string): string {
  return [
    `# ${siteConfig.name}`,
    `> ${siteConfig.description}`,
    'Киномалыш превращает одно фото ребёнка в персональный мультфильм или книгу с озвучкой, где этот ребёнок — главный герой. Работает на нейросетях, результат готов за 15 минут, без студии и без ожидания доставки.',
    `## Ключевые факты\n\n${siteConfig.facts.map((f) => `- ${f}`).join('\n')}`,
    `## Цены\n\n${PACKS.map((p) => `- ${p.label} — ${p.rub} ₽`).join('\n')}`,
    `## Сюжеты\n\n${PLOTS.map((p) => `- ${p.title} (${p.ages} лет): ${p.tagline}. ${p.benefit}.`).join('\n')}`,
    `## Частые вопросы\n\n${FAQ.map((item) => `- **${item.q}** ${item.a}`).join('\n')}`,
    `## Страницы\n\n${INDEXABLE_PATHS.map((path) => {
      const page = PAGE_META.find((p) => p.path === path)
      return `- [${page?.title ?? path}](${url}${path}): ${page?.description ?? ''}`
    }).join('\n')}`,
    `## Optional\n\n- [Полная версия одним файлом](${url}/llms-full.txt)\n- [Sitemap](${url}/sitemap.xml)`,
  ].join('\n\n')
}

function buildLlmsFullTxt(url: string): string {
  const plots = PLOTS.map((p) =>
    [
      `### ${p.title}`,
      `Возраст: ${p.ages}. ${p.premium ? 'Премиальный сюжет.' : 'Базовый сюжет.'}`,
      p.tagline,
      `Чему учит: ${p.benefit}.`,
    ].join('\n'),
  ).join('\n\n')

  return [
    `# ${siteConfig.name} — полная версия для AI`,
    `> ${siteConfig.description}`,
    `Канонические HTML-версии страниц — на ${url}.`,
    '## Что это за продукт\n\nКиномалыш — российский сервис персональных детских сказок. Родитель загружает одно фото ребёнка, выбирает сюжет, бесплатно утверждает портрет героя и кадры будущих сцен, и только затем оплачивает результат. Мультфильм длится две минуты и готов примерно за 15 минут; книга с иллюстрациями и озвучкой — за несколько минут.',
    `## Цены\n\n${PACKS.map((p) => `- ${p.label} — ${p.rub} ₽${p.badge ? ` (${p.badge})` : ''}`).join('\n')}`,
    '## Чем отличается от конкурентов\n\nСтудийные персональные мультфильмы в России стоят 12 700–14 300 ₽ и делаются от двух до семи дней силами аниматоров. Печатные именные книги идут 5–14 дней из-за типографии и доставки. Киномалыш отдаёт готовый мультфильм за 15 минут и стоит 1 990 ₽, то есть примерно в 6–7 раз дешевле студийного производства.',
    `## Сюжеты\n\n${plots}`,
    `## Частые вопросы\n\n${FAQ.map((item) => `### ${item.q}\n\n${item.a}`).join('\n\n')}`,
    '## Приватность\n\nФото ребёнка используется только для генерации конкретной сказки и автоматически удаляется через неделю. Оно не применяется для обучения нейросетей.',
  ].join('\n\n---\n\n')
}

export function seoPlugin(): Plugin {
  const url = siteConfig.url

  const files: Record<string, { body: string; type: string }> = {
    'robots.txt': { body: buildRobotsTxt(url), type: 'text/plain; charset=utf-8' },
    'sitemap.xml': { body: buildSitemap(url), type: 'application/xml; charset=utf-8' },
    'llms.txt': { body: buildLlmsTxt(url), type: 'text/plain; charset=utf-8' },
    'llms-full.txt': { body: buildLlmsFullTxt(url), type: 'text/plain; charset=utf-8' },
  }

  return {
    name: 'kinomalysh-seo',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', url)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.replace(/^\//, '').split('?')[0] ?? ''
        const file = files[name]
        if (!file) return next()
        res.setHeader('Content-Type', file.type)
        res.end(file.body)
      })
    },
    generateBundle() {
      for (const [fileName, file] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName, source: file.body })
      }
    },
  }
}
