import { useEffect } from 'react'
import { ArrowsClockwise, Check, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { plural } from '@/shared/lib/format'
import { useWizard } from '@/features/wizard/model'

const POLL_MS = 4000

export function StepCasting() {
  const order = useWizard((s) => s.order)
  const refreshOrder = useWizard((s) => s.refreshOrder)
  const pickVariant = useWizard((s) => s.pickVariant)
  const askAnother = useWizard((s) => s.askAnother)
  const submitting = useWizard((s) => s.submitting)
  const error = useWizard((s) => s.error)

  const drawing = order?.status === 'casting'
  const variants = order?.castingUrls ?? []
  const attemptsLeft = order?.castingAttemptsLeft ?? 0

  useEffect(() => {
    if (!drawing) return
    const timer = window.setInterval(() => void refreshOrder(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [drawing, refreshOrder])

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Вот ваш герой</h1>
        <p className="text-sm text-ink-800">
          Нейросеть нарисовала, каким ваш ребёнок станет в мультфильме. Выберите портрет, который
          нравится больше. Платить пока не нужно
        </p>
      </header>

      {error && (
        <Card className="flex items-start gap-3 p-4">
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
          <p className="text-sm text-ink-800">{error}</p>
        </Card>
      )}

      {drawing || variants.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((key) => (
              <div key={key} className="aspect-[3/4] animate-pulse rounded-2xl bg-paper-shade" />
            ))}
          </div>
          <p className="text-center text-sm text-ink-500">
            Обычно занимает пару минут. Страницу можно не закрывать
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-3 gap-3">
            {variants.map((url, index) => (
              <li key={url}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void pickVariant(index)}
                  className={cn(
                    'group relative block w-full overflow-hidden rounded-2xl border-2 border-ink-900/15 transition-all duration-150',
                    'hover:-translate-y-0.5 hover:border-mustard active:translate-y-0 disabled:opacity-50',
                  )}
                >
                  <img
                    src={url}
                    alt={`Вариант героя ${index + 1}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-night-950/80 py-1.5 text-xs font-semibold text-cream opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <Check className="h-3.5 w-3.5" />
                    Выбрать
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {attemptsLeft > 0 ? (
            <Button
              variant="secondary"
              className="w-full"
              loading={submitting}
              onClick={() => void askAnother()}
            >
              <ArrowsClockwise className="h-4 w-4" />
              Не похож, нарисуйте ещё
              <span className="text-xs font-normal opacity-70">
                осталось {attemptsLeft} {plural(attemptsLeft, 'попытка', 'попытки', 'попыток')}
              </span>
            </Button>
          ) : (
            <p className="text-center text-xs text-ink-500">
              Бесплатные перерисовки закончились. Выберите вариант, который ближе всего
            </p>
          )}
        </>
      )}
    </div>
  )
}
