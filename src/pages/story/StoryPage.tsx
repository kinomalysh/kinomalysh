import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, DownloadSimple, Gift, Play, ShareNetwork } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ROUTES } from '@/shared/config/routes'
import { getPlot } from '@/entities/plot/model'
import { useLibrary } from '@/entities/story/model'

export function StoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const story = useLibrary((s) => s.stories.find((st) => st.id === id))
  const plot = story ? getPlot(story.plotId) : undefined

  if (!story) {
    return (
      <div className="pt-16 text-center">
        <p className="font-display text-xl text-ink-900">Сказка не найдена</p>
        <Button variant="secondary" className="mt-6" onClick={() => navigate(ROUTES.library)}>
          В библиотеку
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 pt-2 animate-rise">
      <button
        type="button"
        onClick={() => navigate(ROUTES.library)}
        className="flex cursor-pointer items-center gap-2 text-sm text-ink-800 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Библиотека
      </button>

      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-ink-900/15 bg-night-900">
        {plot && (
          <img
            src={plot.image}
            alt={`Кадр из сказки «${plot.title}»`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <button
          type="button"
          aria-label="Смотреть сказку"
          className="relative z-10 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-cream text-night-950 shadow-[0_4px_16px_rgba(0,0,0,0.4)] transition-transform duration-200 hover:brightness-105 active:scale-95"
        >
          <Play weight="fill" className="ml-1 h-7 w-7" />
        </button>
        <span className="absolute bottom-4 right-4 z-10 rounded-full bg-night-950/70 px-2.5 py-1 text-[11px] text-cream">
          {story.durationLabel}
        </span>
      </div>

      <header>
        <h1 className="font-display text-2xl text-ink-900">{plot?.title}</h1>
        <p className="mt-1 text-sm text-ink-800">
          Главный герой — {story.childName} · создана {story.createdAt}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary">
          <DownloadSimple className="h-4 w-4" />
          Скачать
        </Button>
        <Button variant="secondary">
          <ShareNetwork className="h-4 w-4" />
          Поделиться
        </Button>
      </div>

      <Card className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-poppy/10">
          <Gift className="h-5 w-5 text-poppy" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-900">Понравилась сказка?</p>
          <p className="text-xs text-ink-800">Подарите такую же — сертификат за минуту</p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => navigate(ROUTES.profile)}>
          Подарить
        </Button>
      </Card>

      <p className="rounded-2xl bg-white border border-ink-900/15 p-4 text-xs leading-relaxed text-ink-500">
        Файл хранится ещё {story.expiresInDays} дн., потом удалится автоматически. Скачайте видео,
        чтобы сохранить сказку навсегда.
      </p>
    </div>
  )
}
