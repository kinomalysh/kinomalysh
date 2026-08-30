import { Check, FilmSlate, SpeakerHigh, Sparkle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import type { CatalogProduct } from '@/entities/catalog/model'

interface VideoProductCardProps {
  product: CatalogProduct
  onOrder: () => void
  className?: string
}

const INCLUDED = [
  {
    icon: Sparkle,
    title: 'Ваш ребёнок в главной роли',
    text: 'Одно фото, и вы бесплатно утверждаете портрет героя до оплаты. Дальше он остаётся собой во всех сценах.',
  },
  {
    icon: FilmSlate,
    title: 'Две минуты анимации',
    text: 'Полноценная история с началом, испытанием и тёплым финалом, а не набор красивых кадров.',
  },
  {
    icon: SpeakerHigh,
    title: 'Озвучка с именем',
    text: 'Диктор произносит имя ребёнка в нужном падеже, а не подставляет его механически.',
  },
]

export function VideoProductCard({ product, onOrder, className }: VideoProductCardProps) {
  const priceRub = product.priceTokens * 10

  return (
    <article className={cn('space-y-10', className)}>
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-center lg:gap-10">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-poppy">
            Персональный мультфильм{product.audience ? ` · ${product.audience}` : ''}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-[1.05] tracking-[-0.02em] text-ink-900 lg:text-5xl">
            {product.title}
          </h1>
          {product.tagline && (
            <p className="mt-3 text-base text-ink-800 lg:text-lg">{product.tagline}</p>
          )}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <Stat label="Длительность" value="2 минуты" />
            <Stat label="Готово за" value="15 минут" />
            <Stat label="Формат" value="MP4" />
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={onOrder}>
              Сделать мультфильм за {priceRub} ₽
            </Button>
            <p className="text-sm text-ink-800">
              Героя показываем бесплатно
              <br />
              до оплаты
            </p>
          </div>
        </div>

        {product.previewUrl && (
          <div className="order-1 lg:order-2">
            <video
              src={product.previewUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full rounded-3xl border-2 border-ink-900/15 bg-night-950"
            />
          </div>
        )}
      </header>

      {product.about && (
        <section className="max-w-2xl">
          <h2 className="font-display text-2xl text-ink-900">О чём эта история</h2>
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink-800">
            {product.about}
          </p>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl text-ink-900">Что вы получаете</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {INCLUDED.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl border border-ink-900/8 bg-white/70 p-5 backdrop-blur-sm"
            >
              <item.icon className="h-6 w-6 text-poppy" weight="duotone" aria-hidden />
              <h3 className="mt-3 font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-800">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl bg-ink-900 p-7 text-paper lg:p-9">
        <h2 className="font-display text-2xl">Как это работает</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            'Загружаете одно фото ребёнка',
            'Бесплатно выбираете портрет героя из трёх',
            'Через пятнадцать минут мультфильм на полке',
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mustard text-sm font-bold text-ink-900">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-paper/85">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={onOrder}>
            Сделать мультфильм за {priceRub} ₽
          </Button>
          <p className="flex items-center gap-2 text-sm text-paper/75">
            <Check className="h-4 w-4 text-mustard" weight="bold" aria-hidden />
            Без подписки, оплата один раз
          </p>
        </div>
      </section>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-ink-800/70">{label}</dt>
      <dd className="mt-0.5 font-display text-xl text-ink-900">{value}</dd>
    </div>
  )
}
