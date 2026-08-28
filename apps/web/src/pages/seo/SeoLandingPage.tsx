import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { JsonLd } from '@/shared/ui/JsonLd'
import { ROUTES } from '@/shared/config/routes'
import { getSeoPage, type SeoPage } from '@/entities/seo-page/model'
import { Footer } from '@/widgets/footer/Footer'
import { StickyCta } from '@/widgets/landing/StickyCta'
import {
  buildBreadcrumbLd,
  buildFaqLd,
  buildProductLd,
  useSeoMeta,
} from '@/shared/lib/seo'

function SeoLanding({ page }: { page: SeoPage }) {
  const navigate = useNavigate()
  const path = `/${page.slug}`

  useSeoMeta({ title: page.title, description: page.description, path })

  return (
    <div className="shell-narrow pt-4 lg:pt-10">
      <JsonLd data={buildProductLd()} />
      <JsonLd data={buildFaqLd(page.faq)} />
      <JsonLd
        data={buildBreadcrumbLd([
          { name: 'Киномалыш', path: '/' },
          { name: page.h1, path },
        ])}
      />

      <nav aria-label="Хлебные крошки" className="pt-6 text-sm text-ink-800/70">
        <Link to={ROUTES.home} className="underline decoration-dashed underline-offset-4">
          Киномалыш
        </Link>
        <span className="mx-2">/</span>
        <span>{page.h1}</span>
      </nav>

      <header className="pt-4 pb-10">
        <p className="hand-note text-xl rotate-[-1deg]">{page.chapter}</p>
        <h1 className="mt-1 font-display text-hero text-ink-900 text-balance">{page.h1}</h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-800">{page.lead}</p>
        <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={() => navigate(ROUTES.create)}>
          Загрузить фото — бесплатно
        </Button>
      </header>

      {page.sections.map((section) => (
        <section key={section.heading} className="border-t-2 border-dashed border-ink-900/15 py-8">
          <h2 className="font-display text-2xl text-ink-900 text-balance">{section.heading}</h2>
          <p className="mt-3 text-base leading-relaxed text-ink-800">{section.body}</p>
        </section>
      ))}

      <section
        aria-labelledby="seo-faq"
        className="border-t-2 border-dashed border-ink-900/15 py-8"
      >
        <h2 id="seo-faq" className="font-display text-2xl text-ink-900">
          Родители спрашивают
        </h2>
        <dl className="mt-5 space-y-5">
          {page.faq.map((item) => (
            <div key={item.q}>
              <dt className="font-medium text-ink-900">{item.q}</dt>
              <dd className="mt-1 text-base leading-relaxed text-ink-800">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t-2 border-dashed border-ink-900/15 py-8">
        <h2 className="font-display text-2xl text-ink-900">Ещё по теме</h2>
        <ul className="mt-4 space-y-2">
          {page.related.map((slug) => {
            const related = getSeoPage(slug)
            if (!related) return null
            return (
              <li key={slug}>
                <Link
                  to={`/${slug}`}
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
    </div>
  )
}

export function SeoLandingPage() {
  const { slug } = useParams()
  const page = slug ? getSeoPage(slug) : undefined

  if (!page) return <Navigate to={ROUTES.home} replace />
  return <SeoLanding page={page} />
}
