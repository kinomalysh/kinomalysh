import { useEffect } from 'react'
import { SEO, siteConfig, type SeoMeta } from '@/shared/config/site'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSeoMeta(meta: SeoMeta) {
  const { title, description, path, noindex } = meta

  useEffect(() => {
    const canonical = `${siteConfig.url}${path === '/' ? '/' : path}`

    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
    )
    setLink('canonical', canonical)

    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  }, [title, description, path, noindex])
}

export function useSeo(key: keyof typeof SEO, overrides?: Partial<SeoMeta>) {
  useSeoMeta({ ...SEO[key], ...overrides })
}

export function buildBreadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  }
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export function buildOrganizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo-wordmark.png`,
    description: siteConfig.description,
    slogan: 'Ваш ребёнок — герой мультфильма',
    knowsAbout: [
      'Персональные мультфильмы по фото ребёнка',
      'Персонализированные детские сказки',
      'Именные книги для детей',
      'Генерация детских историй нейросетью',
    ],
    sameAs: [siteConfig.contacts.telegram],
    areaServed: { '@type': 'Country', name: 'Russia' },
  }
}

export function buildWebsiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: 'ru-RU',
    description: siteConfig.description,
  }
}

export function buildProductLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Персональный мультфильм «Киномалыш»',
    description:
      'Мультфильм на 2 минуты по одному фото ребёнка: ваш ребёнок становится главным героем. Кастинг героя бесплатный, готовый мультфильм — за 15 минут.',
    brand: { '@type': 'Brand', name: siteConfig.name },
    image: `${siteConfig.url}${siteConfig.ogImage}`,
    audience: { '@type': 'PeopleAudience', suggestedMinAge: 2, suggestedMaxAge: 10 },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'RUB',
      lowPrice: siteConfig.price.book,
      highPrice: siteConfig.price.family,
      offerCount: 4,
      availability: 'https://schema.org/InStock',
    },
  }
}

export function buildHowToLd(steps: { title: string; text: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Как сделать персональный мультфильм по фото ребёнка',
    description:
      'Четыре шага от фотографии до готового мультфильма, где ваш ребёнок — главный герой.',
    totalTime: 'PT15M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'RUB', value: siteConfig.price.video },
    step: steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.text,
    })),
  }
}

export function buildVideoLd(video: {
  name: string
  description: string
  thumbnail: string
  contentUrl: string
  uploadDate: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name,
    description: video.description,
    thumbnailUrl: `${siteConfig.url}${video.thumbnail}`,
    contentUrl: `${siteConfig.url}${video.contentUrl}`,
    uploadDate: video.uploadDate,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: { '@type': 'ImageObject', url: `${siteConfig.url}/logo-wordmark.png` },
    },
  }
}

export function buildFaqLd(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}
