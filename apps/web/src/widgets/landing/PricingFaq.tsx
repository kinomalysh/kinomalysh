import { useState } from 'react'
import { FAQ } from '@/shared/config/faq'
import { Button } from '@/shared/ui/Button'
import type { CSSProperties } from 'react'
import { useReveal } from '@/shared/lib/useReveal'
import { useNavigate } from 'react-router-dom'
import { CaretDown, Check } from '@phosphor-icons/react'
import { cn } from '@/shared/lib/cn'
import { ROUTES } from '@/shared/config/routes'
import { ChapterTitle } from '@/widgets/landing/Sections'

const GUARANTEES = [
  {
    title: 'Кастинг - бесплатно',
    text: 'Три портрета героя рисуем до всякой оплаты. Не похож - перерисуем ещё раз',
  },
  {
    title: 'Фото живёт неделю',
    text: 'Снимок нужен только для вашей сказки и удаляется через семь дней автоматически',
  },
  {
    title: 'Цена - одна и понятная',
    text: 'Книга - 250 ₽. Мультфильм - 1 990 ₽. Никаких подписок',
  },
]

export function Pricing() {
  const navigate = useNavigate()
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} aria-labelledby="pricing-heading" className="shell py-12 lg:py-16">
      <ChapterTitle chapter="глава 3" title="Платите в самом конце" id="pricing-heading" />
      <ul className="mt-7 space-y-3 lg:mt-10 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        {GUARANTEES.map((g, i) => (
          <li
            key={g.title}
            className="reveal paper flex items-start gap-4 rounded-3xl p-5 lg:flex-col lg:gap-3 lg:p-7"
            style={{ '--reveal-delay': i * 80 + 'ms' } as CSSProperties}
          >
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink-900',
                i % 2 === 0 ? 'bg-mustard text-night-950' : 'bg-poppy text-on-poppy',
              )}
            >
              <Check className="h-4 w-4" weight="bold" />
            </span>
            <span>
              <span className="block font-display text-lg text-ink-900 lg:text-xl">{g.title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-800">{g.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="reveal mt-5 flex flex-col items-center gap-3 lg:mt-10">
        <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate(ROUTES.create)}>
          Загрузить фото - бесплатно
        </Button>
        <p className="hand-note text-base rotate-[-1deg]">
          дарят на дни рождения - сертификат оформляется за минуту
        </p>
      </div>
    </section>
  )
}


export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section aria-labelledby="faq-heading" className="shell py-12 lg:py-16">
      <div className="lg:grid lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ChapterTitle chapter="глава 4" title="Родители спрашивают" id="faq-heading" />
          <p className="hand-note mt-4 hidden rotate-[-1deg] text-lg lg:block">
            не нашли своё? напишите в телеграм, отвечаем живыми словами
          </p>
        </div>
        <div className="mt-7 divide-y-2 divide-dashed divide-ink-900/15 border-y-2 border-dashed border-ink-900/15 lg:mt-0">
        {FAQ.map((item, i) => {
          const isOpen = open === i
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left lg:py-5"
              >
                <span className="font-display text-base text-ink-900 lg:text-lg">{item.q}</span>
                <CaretDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && (
                <p className="animate-rise pb-5 pr-8 text-sm leading-relaxed text-ink-800">{item.a}</p>
              )}
            </div>
          )
        })}
        </div>
      </div>
    </section>
  )
}
