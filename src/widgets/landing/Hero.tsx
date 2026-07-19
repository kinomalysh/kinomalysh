import { useNavigate } from 'react-router-dom'
import { ArrowDown } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { MagicCard } from '@/shared/ui/MagicCard'
import { ROUTES } from '@/shared/config/routes'
import { asset } from '@/shared/lib/asset'

export function Hero() {
  const navigate = useNavigate()

  return (
    <section aria-labelledby="hero-heading" className="pt-6 pb-14 md:pt-12">
      <div className="md:grid md:grid-cols-[1fr_minmax(280px,340px)] md:items-center md:gap-10">
        <div>
          <p className="hand-note text-xl rotate-[-1deg] animate-settle">сегодня вечером —</p>
          <h1
            id="hero-heading"
            className="mt-1 font-display text-hero text-ink-900 text-balance animate-settle"
            style={{ animationDelay: '90ms' }}
          >
            ваш ребёнок — <span className="marker-line whitespace-nowrap">герой мультфильма</span>
          </h1>
          <p
            className="mt-4 max-w-md text-base leading-relaxed text-ink-800 animate-settle"
            style={{ animationDelay: '200ms' }}
          >
            Одно фото — и через 15 минут готов мультфильм или книга с озвучкой, где главную роль
            играет ваш ребёнок.
          </p>
          <div className="mt-6 animate-pop" style={{ animationDelay: '380ms' }}>
            <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate(ROUTES.create)}>
              Загрузить фото — бесплатно
            </Button>
            <p className="hand-note mt-2.5 text-base rotate-[-1deg]">
              три портрета героя — бесплатно, за пару минут
            </p>
          </div>
        </div>

        <figure className="mx-auto mt-10 w-full max-w-sm md:mt-0 md:max-w-none animate-settle" style={{ animationDelay: '280ms' }}>
          <div className="sticker rounded-[2rem] p-1.5 animate-floaty">
            <MagicCard photoSrc={asset('demo-photo.jpg')} heroSrc={asset('demo-hero.jpg')} />
          </div>
        </figure>
      </div>

      <button
        type="button"
        onClick={() => document.getElementById('demo-reel')?.scrollIntoView({ behavior: 'smooth' })}
        className="mt-14 flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink-800 transition-colors hover:text-poppy"
      >
        <ArrowDown className="h-4 w-4" />
        Посмотреть фрагмент сказки
      </button>
    </section>
  )
}
