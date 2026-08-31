import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Play } from '@phosphor-icons/react'
import { ROUTES } from '@/shared/config/routes'
import { BookCover } from '@/widgets/product/BookCover'
import { fetchCatalog, type CatalogProduct } from '@/entities/catalog/model'

const BOOK_LINES = [
  'Восемь разворотов: иллюстрация во весь лист, текст сверху',
  'Десять сюжетов: темнота, злость, садик, врач, горшок',
  'Читается прямо на сайте, листается пальцем',
  'Готово за пять минут',
]

const VIDEO_LINES = [
  'Полная история с началом и тёплым финалом',
  'Озвучка произносит имя ребёнка и склоняет его',
  'Скачивается файлом и остаётся в семье',
  'Готово примерно за пятнадцать минут',
]

export function Categories() {
  const [products, setProducts] = useState<CatalogProduct[]>([])

  useEffect(() => {
    fetchCatalog()
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [])

  const books = products.filter((p) => p.kind === 'book').slice(0, 3)
  const video = products.find((p) => p.kind === 'video') ?? null

  return (
    <section id="categories" aria-labelledby="categories-heading" className="shell py-14 lg:py-20">
      <p className="hand-note text-lg text-mustard-deep">что бывает</p>
      <h2
        id="categories-heading"
        className="mt-1 max-w-2xl font-display text-3xl leading-[1.06] tracking-[-0.02em] text-ink-900 lg:text-[2.75rem]"
      >
        Две вещи, где ваш ребёнок - главный герой
      </h2>
      <p className="mt-3 max-w-xl text-pretty text-base text-ink-800">
        Обе начинаются с одного фото. Портрет героя вы утверждаете бесплатно, до оплаты.
      </p>

      <div className="mt-9 grid gap-5 lg:grid-cols-2 lg:gap-7">
        <CategoryCard
          to={ROUTES.books}
          kicker="Книга"
          title="Иллюстрированная сказка"
          price="250 ₽"
          lines={BOOK_LINES}
          visual={
            books.length > 0 ? (
              <div className="relative mx-auto flex h-full w-full max-w-[15rem] items-center justify-center">
                {books.map((book, i) => (
                  <div
                    key={book.id}
                    className="absolute w-[62%] transition-transform duration-500 ease-out group-hover/cat:translate-y-[-4px]"
                    style={{
                      transform: `translateX(${(i - 1) * 34}px) rotate(${(i - 1) * 7}deg)`,
                      zIndex: i === 1 ? 3 : 1,
                    }}
                  >
                    <BookCover title={book.title} imageUrl={book.previewUrl} />
                  </div>
                ))}
              </div>
            ) : null
          }
        />

        <CategoryCard
          to={ROUTES.cartoons}
          kicker="Мультфильм"
          title="Две минуты анимации"
          price="1 990 ₽"
          lines={VIDEO_LINES}
          visual={
            video?.previewUrl ? (
              <div className="relative mx-auto aspect-[3/4] w-[62%] max-w-[10rem] overflow-hidden rounded-2xl bg-night-900 shadow-[0_18px_40px_-18px_rgba(12,10,30,0.75)]">
                <video
                  src={`${video.previewUrl}#t=1`}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-cream/90 text-night-950 transition-transform duration-300 group-hover/cat:scale-110">
                    <Play weight="fill" className="ml-0.5 h-5 w-5" />
                  </span>
                </span>
              </div>
            ) : null
          }
        />
      </div>
    </section>
  )
}

function CategoryCard({
  to,
  kicker,
  title,
  price,
  lines,
  visual,
}: {
  to: string
  kicker: string
  title: string
  price: string
  lines: string[]
  visual: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="group/cat relative flex flex-col overflow-hidden rounded-3xl border-2 border-ink-900 bg-white shadow-[4px_5px_0_rgba(35,42,69,0.9)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
    >
      <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] sm:items-center lg:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-800/70">
            {kicker}
          </p>
          <h3 className="mt-1 font-display text-2xl leading-[1.1] text-ink-900">{title}</h3>
          <p className="mt-2 font-display text-xl text-mustard-deep">{price}</p>

          <ul className="mt-5 space-y-2 border-t-2 border-dashed border-ink-900/15 pt-5">
            {lines.map((line) => (
              <li key={line} className="flex gap-2.5 text-pretty text-sm leading-relaxed text-ink-800">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mustard" />
                {line}
              </li>
            ))}
          </ul>

          <span className="mt-6 inline-flex items-center gap-2 font-semibold text-ink-900">
            Посмотреть
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover/cat:translate-x-1"
              weight="bold"
              aria-hidden
            />
          </span>
        </div>

        <div className="order-first h-40 sm:order-none sm:h-52">{visual}</div>
      </div>
    </Link>
  )
}
