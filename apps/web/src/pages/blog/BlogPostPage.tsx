import { Link, Navigate, useParams } from 'react-router-dom'
import { JsonLd } from '@/shared/ui/JsonLd'
import { ROUTES } from '@/shared/config/routes'
import { siteConfig } from '@/shared/config/site'
import { getBlogPost, type BlogPost } from '@/entities/blog/model'
import { Footer } from '@/widgets/footer/Footer'
import { StickyCta } from '@/widgets/landing/StickyCta'
import { buildBreadcrumbLd, useSeoMeta } from '@/shared/lib/seo'

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function formatPublished(published: string): string {
  return DATE_FORMAT.format(new Date(published))
}

function buildArticleLd(post: BlogPost, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.h1,
    description: post.description,
    datePublished: post.published,
    dateModified: post.published,
    inLanguage: 'ru-RU',
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteConfig.url}${path}` },
    image: `${siteConfig.url}${siteConfig.ogImage}`,
    author: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url,
      logo: { '@type': 'ImageObject', url: `${siteConfig.url}/logo.png` },
    },
  }
}

function BlogArticle({ post }: { post: BlogPost }) {
  const path = `/blog/${post.slug}`

  useSeoMeta({ title: post.title, description: post.description, path })

  return (
    <>
      <JsonLd data={buildArticleLd(post, path)} />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: 'Киномалыш', path: '/' },
          { name: 'Блог', path: '/blog' },
          { name: post.h1, path },
        ])}
      />

      <nav aria-label="Хлебные крошки" className="pt-6 text-sm text-ink-800/70">
        <Link to={ROUTES.home} className="underline decoration-dashed underline-offset-4">
          Киномалыш
        </Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="underline decoration-dashed underline-offset-4">
          Блог
        </Link>
        <span className="mx-2">/</span>
        <span>{post.h1}</span>
      </nav>

      <header className="pt-4 pb-10">
        <h1 className="font-display text-hero text-ink-900 text-balance">{post.h1}</h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-800">{post.excerpt}</p>
        <p className="mt-5 text-sm text-ink-800/70">
          <time dateTime={post.published}>{formatPublished(post.published)}</time>
          <span className="mx-2">·</span>
          <span>{post.readingMinutes} мин чтения</span>
        </p>
      </header>

      {post.sections.map((section) => (
        <section key={section.heading} className="border-t-2 border-dashed border-ink-900/15 py-8">
          <h2 className="font-display text-2xl text-ink-900 text-balance">{section.heading}</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-800">{section.body}</p>
        </section>
      ))}

      <section className="border-t-2 border-dashed border-ink-900/15 py-8">
        <h2 className="font-display text-2xl text-ink-900">Читайте также</h2>
        <ul className="mt-4 space-y-2">
          {post.related.map((slug) => {
            const related = getBlogPost(slug)
            if (!related) return null
            return (
              <li key={slug}>
                <Link
                  to={`/blog/${slug}`}
                  className="underline decoration-dashed underline-offset-4 hover:text-ember-600"
                >
                  {related.h1}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <Footer />
      <StickyCta />
    </>
  )
}

export function BlogPostPage() {
  const { slug } = useParams()
  const post = slug ? getBlogPost(slug) : undefined

  if (!post) return <Navigate to="/blog" replace />
  return <BlogArticle post={post} />
}
