import { useNavigate } from 'react-router-dom'
import { BookOpen, FilmSlate, Clock, Play, Plus } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ROUTES } from '@/shared/config/routes'
import { getPlot } from '@/entities/plot/model'
import { STATUS_LABELS, useLibrary } from '@/entities/story/model'
import { cn } from '@/shared/lib/cn'

export function LibraryPage() {
  const navigate = useNavigate()
  const stories = useLibrary((s) => s.stories)

  return (
    <div className="space-y-5 pt-2 animate-rise">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Библиотека</h1>
          <p className="mt-1 text-sm text-ink-800">Сказки хранятся 30 дней — скачивайте</p>
        </div>
        <Button size="sm" onClick={() => navigate(ROUTES.create)}>
          <Plus className="h-4 w-4" />
          Новая
        </Button>
      </header>

      {stories.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg text-ink-900">Здесь пока пусто</p>
          <p className="mt-2 text-sm text-ink-800">
            Создайте первую сказку — кастинг героя бесплатный
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {stories.map((story) => {
            const plot = getPlot(story.plotId)
            const ready = story.status === 'ready'
            const FormatIcon = story.format === 'video' ? FilmSlate : BookOpen
            return (
              <li key={story.id}>
                <Card
                  interactive={ready}
                  onClick={ready ? () => navigate(ROUTES.story(story.id)) : undefined}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-night-900">
                    {plot && (
                      <img
                        src={plot.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    )}
                    {ready && (
                      <span className="absolute inset-0 flex items-center justify-center bg-night-950/40">
                        <Play weight="fill" className="h-5 w-5 text-cream" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium text-ink-900">
                      {plot?.title ?? 'Сказка'} · {story.childName}
                    </h2>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                      <FormatIcon className="h-3.5 w-3.5" />
                      {story.durationLabel}
                      <span aria-hidden>·</span>
                      <Clock className="h-3.5 w-3.5" />
                      ещё {story.expiresInDays} дн.
                    </p>
                    <span
                      className={cn(
                        'mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        ready
                          ? 'bg-leaf/12 text-leaf'
                          : story.status === 'failed'
                            ? 'bg-berry/10 text-berry'
                            : 'bg-mustard/25 text-mustard-deep',
                      )}
                    >
                      {STATUS_LABELS[story.status]}
                    </span>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
