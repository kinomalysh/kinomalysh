import type { CSSProperties } from 'react'
import { Play } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/shared/config/routes'
import { useReveal } from '@/shared/lib/useReveal'
import { PLOTS } from '@/entities/plot/model'
import { cn } from '@/shared/lib/cn'

interface ChapterTitleProps {
  chapter: string
  title: string
  id: string
}

export function ChapterTitle({ chapter, title, id }: ChapterTitleProps) {
  return (
    <div className="flex items-baseline gap-3 lg:gap-4">
      <span className="hand-note shrink-0 rotate-[-2deg] text-lg lg:text-xl">{chapter}</span>
      <h2 id={id} className="font-display text-2xl text-balance text-ink-900 lg:text-3xl">
        {title}
      </h2>
    </div>
  )
}

export const STEPS = [
  {
    title: 'Выберите мультфильм',
    text: 'Готовая история с озвучкой и музыкой. Остаётся добавить в неё героя',
    note: 'сюжеты проверены редактором',
  },
  {
    title: 'Пришлите фото',
    text: 'Одно светлое фото анфас - этого достаточно, чтобы нейросеть узнала вашего ребёнка',
    note: 'как на детсадовскую фотографию',
  },
  {
    title: 'Выберите двойника',
    text: 'Нейросеть рисует три мультяшных портрета. Не похож - нарисуем ещё, тоже бесплатно',
    note: 'платить пока не нужно',
  },
  {
    title: 'Смотрите вместе',
    text: 'Через 5-20 минут мультфильм с озвучкой ждёт на полке. Или книга - PDF плюс аудио',
    note: 'и так каждый вечер, если захочется',
  },
]

export function Magic() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} aria-labelledby="magic-heading" className="shell py-12 lg:py-16">
      <ChapterTitle chapter="глава 1" title="Магия в одном фото" id="magic-heading" />
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-800 lg:text-base">
        Нейросеть смотрит на фото и рисует мультяшного двойника: причёска, улыбка и любимая
        футболка остаются на месте
      </p>
      <div className="reveal mt-8 flex items-center justify-center gap-3 sm:gap-6 lg:mt-12 lg:gap-14">
        <figure className="w-[38%] max-w-52 rotate-[-2.5deg] lg:max-w-sm">
          <div className="sticker overflow-hidden rounded-2xl">
            <img
              src="/demo-photo.webp"
              alt="Обычное фото девочки"
              width={560}
              height={560}
              loading="lazy"
              className="block aspect-square w-full object-cover"
            />
          </div>
          <figcaption className="hand-note mt-2.5 text-center text-base">ваше фото</figcaption>
        </figure>
        <svg
          viewBox="0 0 64 40"
          aria-hidden
          className="w-14 shrink-0 text-poppy sm:w-16 lg:w-24"
        >
          <path
            d="M4 26 C 22 10, 40 10, 56 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M46 14 L 57 20 L 45 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <figure className="w-[38%] max-w-52 rotate-[2.5deg] lg:max-w-sm">
          <div className="sticker overflow-hidden rounded-2xl">
            <img
              src="/demo-hero.webp"
              alt="Та же девочка в виде мультяшного персонажа"
              width={560}
              height={560}
              loading="lazy"
              className="block aspect-square w-full object-cover"
            />
          </div>
          <figcaption className="hand-note mt-2.5 text-center text-base">герой сказки</figcaption>
        </figure>
      </div>
      <p className="hand-note mx-auto mt-6 max-w-xs text-center text-lg lg:mt-8 lg:max-w-sm lg:text-xl">
        похож или нет - решаете вы. портреты рисуем бесплатно
      </p>
    </section>
  )
}

const REVIEWS = [
  {
    text: 'Дочка теперь каждый вечер спрашивает, когда снова будет сказка про неё',
    author: 'Аня, мама Веры, 4 года',
  },
  {
    text: 'Сын перестал воевать с зубной щёткой. Серьёзно, на третий день',
    author: 'Дмитрий, папа Марка, 3 года',
  },
  {
    text: 'Отправила мультфильм бабушке - она пересматривала его пять раз',
    author: 'Ольга, мама Сони, 6 лет',
  },
]

export function Reviews() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} aria-label="Отзывы родителей" className="shell py-12 lg:py-16">
      <p className="hand-note rotate-[-1deg] text-lg lg:text-xl">на полях - родители пишут:</p>
      <div className="mt-5 space-y-3 lg:mt-8 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0">
        {REVIEWS.map((review, i) => (
          <blockquote
            key={review.author}
            className={cn(
              'reveal paper max-w-md rounded-3xl p-5 lg:max-w-none lg:p-6',
              i % 2 === 1 ? 'ml-auto rotate-[0.6deg] lg:ml-0' : 'rotate-[-0.6deg]',
              i === 1 && 'lg:translate-y-5',
            )}
            style={{ '--reveal-delay': `${i * 90}ms` } as CSSProperties}
          >
            <p className="font-hand text-xl leading-snug text-ink-900 lg:text-2xl">«{review.text}»</p>
            <footer className="mt-2 text-xs font-semibold text-ink-500">{review.author}</footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}

export function HowItWorks() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} aria-labelledby="how-heading" className="shell py-12 lg:py-16">
      <ChapterTitle chapter="глава 2" title="Как рождается сказка" id="how-heading" />
      <ol className="mt-8 space-y-0 lg:mt-12 lg:grid lg:grid-cols-4 lg:gap-8">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className={cn(
              'reveal relative border-l-2 border-dashed border-ink-900/25 pb-8 pl-7',
              'lg:border-l-0 lg:border-t-2 lg:pb-0 lg:pl-0 lg:pt-9',
              i === STEPS.length - 1 && 'border-transparent pb-0 lg:border-transparent',
            )}
            style={{ '--reveal-delay': `${i * 90}ms` } as CSSProperties}
          >
            <span
              aria-hidden
              className={cn(
                'absolute -left-[13px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-900 text-xs font-bold',
                'lg:left-0 lg:-top-[13px] lg:h-7 lg:w-7 lg:text-xs',
                i % 2 === 0 ? 'bg-mustard text-night-950' : 'bg-poppy text-on-poppy',
              )}
            >
              {i + 1}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h3 className="font-display text-lg text-ink-900 lg:text-xl">{step.title}</h3>
              <span className="hand-note text-base">{step.note}</span>
            </div>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-800">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Showcase() {
  const featured = PLOTS
  const navigate = useNavigate()
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} id="showcase" aria-labelledby="showcase-heading" className="shell py-12 lg:py-16">
      <ChapterTitle chapter="глава 1" title="Какой вечер спасаем?" id="showcase-heading" />
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-800 lg:text-base">
        Не «контент», а инструменты на вечер: уснуть без слёз, почистить зубы без войны, подружиться со своей злостью
      </p>
      <div className="-mx-4 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 py-4 scroll-px-5 scrollbar-none lg:mx-0 lg:mt-10 lg:grid lg:grid-cols-3 lg:gap-7 lg:overflow-visible lg:px-0 xl:grid-cols-4">
        {featured.map((plot, i) => (
          <button
            key={plot.id}
            type="button"
            onClick={() => navigate(ROUTES.create)}
            aria-label={`Создать сказку «${plot.title}»`}
            className={cn(
              'reveal sticker flex w-60 shrink-0 cursor-pointer snap-start flex-col rounded-3xl p-3 text-left transition-transform duration-200 hover:-translate-y-1 hover:rotate-0 lg:w-auto',
              i % 2 === 0 ? 'rotate-[-1.3deg]' : 'rotate-[1.3deg]',
            )}
            style={{ '--reveal-delay': `${(i % 4) * 80}ms` } as CSSProperties}
          >
            <div className="relative flex aspect-[4/3] items-end justify-between overflow-hidden rounded-2xl bg-night-900 p-3">
              <img
                src={plot.image}
                alt={`Кадр из сказки «${plot.title}»`}
                width={880}
                height={480}
                loading={i > 1 ? 'lazy' : 'eager'}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <span className="relative z-10 rounded-full bg-night-950/70 px-2.5 py-1 text-xs font-semibold text-cream">
                {plot.premium ? '≈3 мин' : '≈2 мин'}
              </span>
              <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-cream/95 text-night-950 shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
                <Play weight="fill" className="ml-0.5 h-4 w-4" />
              </span>
            </div>
            <h3 className="mt-3 px-1 font-display text-lg leading-snug text-ink-900 lg:text-xl">
              {plot.title}
            </h3>
            <p className="mt-1 px-1 text-xs leading-relaxed text-ink-800">{plot.tagline}</p>
            <p className="mt-auto flex items-center justify-between px-1 pb-1 pt-3">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-500">
                {plot.ages} лет
              </span>
              <span className="text-xs font-semibold text-leaf">{plot.benefit}</span>
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
