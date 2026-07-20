import { Link } from 'react-router-dom'
import { JsonLd } from '@/shared/ui/JsonLd'
import { ROUTES } from '@/shared/config/routes'
import { BLOG_INDEX, siteConfig } from '@/shared/config/site'
import { BLOG_POSTS } from '@/entities/blog/model'
import { Footer } from '@/widgets/footer/Footer'
import { StickyCta } from '@/widgets/landing/StickyCta'
import { buildBreadcrumbLd, useSeoMeta } from '@/shared/lib/seo'

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function buildCollectionLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: BLOG_INDEX.title,
    description: BLOG_INDEX.description,
    url: `${siteConfig.url}/blog`,
    inLanguage: 'ru-RU',
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: BLOG_POSTS.map((post, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: post.h1,
        url: `${siteConfig.url}/blog/${post.slug}`,
      })),
    },
  }
}

export function BlogIndexPage() {
  useSeoMeta(BLOG_INDEX)

  const posts = [...BLOG_POSTS].sort((a, b) => b.published.localeCompare(a.published))

  return (
    <>
      <JsonLd data={buildCollectionLd()} />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: 'Киномалыш', path: '/' },
          { name: 'Блог', path: '/blog' },
        ])}
      />

      <nav aria-label="Хлебные крошки" className="pt-6 text-sm text-ink-800/70">
        <Link to={ROUTES.home} className="underline decoration-dashed underline-offset-4">
          Киномалыш
        </Link>
        <span className="mx-2">/</span>
        <span>Блог</span>
      </nav>

      <header className="pt-4 pb-10">
        <p className="hand-note text-xl rotate-[-1deg]">блог</p>
        <h1 className="mt-1 font-display text-hero text-ink-900 text-balance">
          О сказках, подарках и нейросетях
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-800">
          Пишем о том, с чем родители приходят к нам чаще всего: как выбрать подарок, когда времени
          не осталось, что делать со страхом темноты и долгим засыпанием, и как вообще устроены
          персональные сказки внутри.
        </p>
      </header>

      {posts.map((post) => (
        <article key={post.slug} className="border-t-2 border-dashed border-ink-900/15 py-8">
          <h2 className="font-display text-2xl text-ink-900 text-balance">
            <Link
              to={`/blog/${post.slug}`}
              className="underline decoration-dashed underline-offset-4 hover:text-ember-600"
            >
              {post.h1}
            </Link>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-800">{post.excerpt}</p>
          <p className="mt-3 text-sm text-ink-800/70">
            <time dateTime={post.published}>{DATE_FORMAT.format(new Date(post.published))}</time>
            <span className="mx-2">·</span>
            <span>{post.readingMinutes} мин чтения</span>
          </p>
        </article>
      ))}

      <Footer />
      <StickyCta />
    </>
  )
}
