import { BookOpen, FilmSlate } from '@phosphor-icons/react'
import { PLOTS } from '@/entities/plot/model'
import { cn } from '@/shared/lib/cn'
import { useWizard } from '@/features/wizard/model'

export function StepPlot() {
  const { format, setFormat, choosePlot } = useWizard()

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Какой вечер спасаем?</h1>
        <p className="text-sm text-ink-800">
          Герой уже готов. Сюжеты написаны детским психологом под родительские задачи — выберите сегодняшнюю
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Формат сказки">
        {(
          [
            { value: 'video', label: 'Мультфильм', hint: '~2 минуты видео', icon: FilmSlate },
            { value: 'book', label: 'Книга + аудио', hint: '8 страниц PDF', icon: BookOpen },
          ] as const
        ).map((f) => (
          <button
            key={f.value}
            type="button"
            role="radio"
            aria-checked={format === f.value}
            onClick={() => setFormat(f.value)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-2xl border p-4 text-left cursor-pointer transition-all duration-200',
              format === f.value
                ? 'border-ink-900 bg-mustard/25'
                : 'border-ink-900/15 bg-white hover:border-ink-900/40',
            )}
          >
            <f.icon
              className={cn('h-5 w-5', format === f.value ? 'text-mustard-deep' : 'text-ink-500')}
            />
            <span className="text-sm font-semibold text-ink-900">{f.label}</span>
            <span className="text-xs text-ink-500">{f.hint}</span>
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {PLOTS.map((plot) => (
          <li key={plot.id}>
            <button
              type="button"
              onClick={() => choosePlot(plot.id)}
              className="group paper relative w-full overflow-hidden rounded-3xl p-4 text-left cursor-pointer transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-start gap-4">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-night-900">
                  <img
                    src={plot.image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-lg text-ink-900">{plot.title}</span>
                    {plot.premium && (
                      <span className="rounded-full border border-poppy/50 bg-poppy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-poppy">
                        Герой
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-800">
                    {plot.tagline}
                  </span>
                  <span className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full bg-paper-shade px-2.5 py-1 text-ink-800">
                      {plot.ages} лет
                    </span>
                    <span className="rounded-full bg-paper-shade px-2.5 py-1 text-leaf">
                      {plot.benefit}
                    </span>
                  </span>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
