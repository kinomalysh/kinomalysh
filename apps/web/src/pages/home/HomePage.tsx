import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { JsonLd } from '@/shared/ui/JsonLd'
import { ROUTES } from '@/shared/config/routes'
import { FAQ } from '@/shared/config/faq'
import { siteConfig } from '@/shared/config/site'
import {
  useSeo,
  buildFaqLd,
  buildProductLd,
  buildHowToLd,
  buildVideoLd,
} from '@/shared/lib/seo'
import { Hero } from '@/widgets/landing/Hero'
import { DemoReel } from '@/widgets/landing/DemoReel'
import { StickyCta } from '@/widgets/landing/StickyCta'
import { HowItWorks, Reviews, Showcase, STEPS } from '@/widgets/landing/Sections'
import { Faq, Pricing } from '@/widgets/landing/PricingFaq'
import { Footer } from '@/widgets/footer/Footer'

export function HomePage() {
  const navigate = useNavigate()
  useSeo('home')
  return (
    <>
      <JsonLd data={buildProductLd()} />
      <JsonLd data={buildFaqLd(FAQ)} />
      <JsonLd data={buildHowToLd(STEPS)} />
      <JsonLd
        data={buildVideoLd({
          name: 'Фрагмент персональной сказки «Луна ждёт в гости»',
          description:
            'Пример персонального мультфильма Огонька, где ребёнок становится главным героем истории про путешествие к луне.',
          thumbnail: '/plots/sleep.webp',
          contentUrl: '/story-demo.mp4',
          uploadDate: siteConfig.contentDate,
        })}
      />
      <Hero />
      <DemoReel />
      <Showcase />
      <HowItWorks />
      <Reviews />
      <Pricing />
      <Faq />
      <section className="mb-10 rotate-[-0.6deg] rounded-3xl border-2 border-ink-900 bg-night-900 p-7 shadow-[3px_4px_0_var(--t-hard-shadow)]">
        <p className="hand-note text-lg text-moon-300">эпилог</p>
        <h2 className="mt-1 font-display text-2xl leading-snug text-cream text-balance">
          Сегодня вечером сказка может быть про вашего ребёнка
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-cream/70">
          Загрузите фото — через пару минут покажем три портрета героя. Бесплатно.
        </p>
        <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={() => navigate(ROUTES.create)}>
          Загрузить фото — бесплатно
        </Button>
      </section>
      <Footer />
      <StickyCta />
    </>
  )
}
