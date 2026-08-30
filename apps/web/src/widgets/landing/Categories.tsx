import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, FilmSlate } from '@phosphor-icons/react'
import { ROUTES } from '@/shared/config/routes'

const CATEGORIES = [
  {
    to: ROUTES.books,
    icon: BookOpen,
    kicker: 'Книга',
    title: 'Иллюстрированная сказка в PDF',
    price: '250 ₽',
    lines: [
      'Восемь страниц: иллюстрация во весь лист, текст сверху',
      'Десять сюжетов про темноту, злость, садик, врача',
      'Читается прямо на сайте, листается пальцем',
      'Готово за пять минут',
    ],
    tone: 'book' as const,
  },
  {
    to: ROUTES.cartoons,
    icon: FilmSlate,
    kicker: 'Мультфильм',
    title: 'Две минуты анимации',
    price: '1 990 ₽',
    lines: [
      'Полная история с началом и тёплым финалом',
      'Озвучка произносит имя ребёнка',
      'Скачивается файлом, остаётся в семье',
      'Готово примерно за пятнадцать минут',
    ],
    tone: 'video' as const,
  },
]

export function Categories() {
  return (
    <section id="categories" aria-labelledby="categories-heading" className="shell py-14 lg:py-20">
      <h2
        id="categories-heading"
        className="max-w-xl font-display text-3xl leading-[1.08] tracking-[-0.02em] text-ink-900 lg:text-4xl"
      >
        Две вещи, где ваш ребёнок - главный герой
      </h2>
      <p className="mt-3 max-w-xl text-base text-ink-800">
        Обе начинаются с одного фото. Портрет героя вы утверждаете бесплатно, до оплаты.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.to}
            to={cat.to}
            className="group/cat relative flex flex-col overflow-hidden rounded-3xl border-2 border-ink-900 bg-white p-6 shadow-[4px_5px_0_rgba(35,42,69,0.9)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:-translate-y-0.5 lg:p-8"
          >
            <div
              aria-hidden
              className={
                cat.tone === 'book'
                  ? 'absolute -right-10 -top-10 h-36 w-36 rounded-full bg-mustard/25 blur-2xl'
                  : 'absolute -right-10 -top-10 h-36 w-36 rounded-full bg-poppy/20 blur-2xl'
              }
            />
            <cat.icon className="h-8 w-8 text-poppy" weight="duotone" aria-hidden />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-800/70">
              {cat.kicker}
            </p>
            <h3 className="mt-1 font-display text-2xl text-ink-900">{cat.title}</h3>
            <p className="mt-2 font-display text-xl text-mustard-deep">{cat.price}</p>

            <ul className="mt-5 space-y-2 border-t-2 border-dashed border-ink-900/15 pt-5">
              {cat.lines.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink-800">
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
          </Link>
        ))}
      </div>
    </section>
  )
}
