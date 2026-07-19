import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellRinging, Confetti } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Progress } from '@/shared/ui/Progress'
import { ROUTES } from '@/shared/config/routes'
import { useLibrary } from '@/entities/story/model'
import { useWizard } from '@/features/wizard/model'

const PHASES = [
  'Пишем текст сказки…',
  'Рисуем сцены…',
  'Оживляем кадры…',
  'Записываем озвучку…',
  'Монтируем…',
]

export function StepDone() {
  const navigate = useNavigate()
  const childName = useWizard((s) => s.childName)
  const plotId = useWizard((s) => s.plotId)
  const format = useWizard((s) => s.format)
  const reset = useWizard((s) => s.reset)
  const addStory = useLibrary((s) => s.addStory)
  const [progress, setProgress] = useState(4)
  const done = progress >= 100

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : p + 4 + Math.random() * 7))
    }, 700)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!done || !plotId) return
    addStory({
      id: `story-${Date.now()}`,
      plotId,
      childName: childName.trim() || 'Герой',
      format,
      status: 'ready',
      createdAt: new Date().toISOString().slice(0, 10),
      expiresInDays: 30,
      durationLabel: format === 'video' ? '2 мин 05 сек' : '8 страниц',
    })
  }, [done, plotId, childName, format, addStory])

  const phase = PHASES[Math.min(PHASES.length - 1, Math.floor((progress / 100) * PHASES.length))]

  return (
    <div className="flex flex-col items-center gap-6 pt-10 text-center animate-rise">
      {done ? (
        <>
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-leaf/12">
            <Confetti className="h-9 w-9 text-leaf" />
          </span>
          <div className="space-y-2">
            <h1 className="font-display text-2xl text-ink-900">Сказка готова!</h1>
            <p className="max-w-xs text-sm text-ink-800">
              «{childName.trim() || 'Ваш ребёнок'} — главный герой» уже в вашей библиотеке
            </p>
          </div>
          <Button
            size="lg"
            className="w-full max-w-xs"
            onClick={() => {
              reset()
              navigate(ROUTES.library)
            }}
          >
            Смотреть сказку
          </Button>
        </>
      ) : (
        <>
          <span className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-mustard/25" />
            <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-mustard/25 font-display text-2xl text-mustard-deep">
              {Math.round(progress)}
            </span>
          </span>
          <div className="w-full max-w-xs space-y-3">
            <Progress value={progress} label="Прогресс генерации" />
            <p className="text-sm text-ink-800" aria-live="polite">
              {phase}
            </p>
          </div>
          <p className="flex max-w-xs items-center gap-2 rounded-2xl bg-white border border-ink-900/15 p-4 text-left text-xs leading-relaxed text-ink-800">
            <BellRinging className="h-4 w-4 shrink-0 text-mustard-deep" />
            Можно закрыть страницу — пришлём уведомление, когда сказка будет готова
          </p>
        </>
      )}
    </div>
  )
}
