import { BookOpen, Check, FilePdf, Heart, Sparkle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { plural } from '@/shared/lib/format'
import type { CatalogProduct } from '@/entities/catalog/model'
import { BookReader } from '@/widgets/book-reader/BookReader'

interface BookProductCardProps {
  product: CatalogProduct
  onOrder: () => void
  className?: string
}

const INCLUDED = [
  {
    icon: Sparkle,
    title: 'Ваш ребёнок - главный герой',
    text: 'Вы загружаете одно фото и утверждаете портрет героя. Дальше он остаётся одним и тем же на каждой странице.',
  },
  {
    icon: FilePdf,
    title: 'PDF со страницами',
    text: 'Квадратные страницы: иллюстрация во весь лист, текст сказки сверху. Открывается на телефоне, планшете и компьютере.',
  },
  {
    icon: Heart,
    title: 'Одна книга - одно чувство',
    text: 'Сюжет собран вокруг настоящей детской трудности и проживает её до конца, без нравоучений в финале.',
  },
  {
    icon: BookOpen,
    title: 'Читалка прямо на сайте',
    text: 'Книга живёт в вашей библиотеке: листается пальцем, ничего скачивать не нужно.',
  },
]

export function BookProductCard({ product, onOrder, className }: BookProductCardProps) {
  const pages = product.sceneCount
  const priceRub = product.priceTokens * 10
  const readerPages = product.samplePages.map((page) => ({
    imageUrl: page.imageUrl,
    text: page.text,
  }))

  return (
    <article className={cn('space-y-10', className)}>
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-10">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-poppy">
            Персональная сказка{product.audience ? ` · ${product.audience}` : ''}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-[1.05] tracking-[-0.02em] text-ink-900 lg:text-5xl">
            {product.title}
          </h1>
          {product.tagline && (
            <p className="mt-3 text-base text-ink-800 lg:text-lg">{product.tagline}</p>
          )}

          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <Stat label="Страниц" value={String(pages)} />
            <Stat label="Готово за" value="5 минут" />
            <Stat label="Формат" value="PDF" />
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={onOrder}>
              Сделать книгу за {priceRub} ₽
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
            <div className="relative mx-auto max-w-[420px]">
              <div
                aria-hidden
                className="absolute -inset-3 -z-10 rounded-[2rem] bg-mustard/25 blur-2xl"
              />
              <img
                src={product.previewUrl}
                alt={`Обложка книги «${product.title}»`}
                width={840}
                height={840}
                loading="eager"
                fetchPriority="high"
                className="aspect-square w-full rounded-3xl object-cover shadow-[0_24px_60px_-24px_rgba(20,16,40,0.55)]"
              />
            </div>
          </div>
        )}
      </header>

      {product.about && (
        <section aria-labelledby="about-heading" className="max-w-2xl">
          <h2 id="about-heading" className="font-display text-2xl text-ink-900">
            О чём эта сказка
          </h2>
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-ink-800">
            {product.about}
          </p>
        </section>
      )}

      <section aria-labelledby="included-heading">
        <h2 id="included-heading" className="font-display text-2xl text-ink-900">
          Что вы получаете
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
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

      {readerPages.length > 0 && (
        <section aria-labelledby="pages-heading">
          <h2 id="pages-heading" className="font-display text-2xl text-ink-900">
            Как выглядят страницы
          </h2>
          <p className="mt-2 text-sm text-ink-800">
            {plural(readerPages.length, 'Пример', 'Примера', 'Примеров')} из книги. Листайте пальцем
          </p>
          <BookReader
            title={`Примеры страниц книги «${product.title}»`}
            pages={readerPages}
            className="mt-5 max-w-md"
          />
        </section>
      )}

      <section className="rounded-3xl bg-ink-900 p-7 text-paper lg:p-9">
        <h2 className="font-display text-2xl">Как это работает</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            'Загружаете одно фото ребёнка',
            'Бесплатно выбираете портрет героя из трёх',
            'Через пять минут книга ждёт в библиотеке',
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
            Сделать книгу за {priceRub} ₽
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
