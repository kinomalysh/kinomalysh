import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from '@phosphor-icons/react'
import { ROUTES } from '@/shared/config/routes'
import { Progress } from '@/shared/ui/Progress'
import { STEP_ORDER, useWizard } from '@/features/wizard/model'
import { StepPlot } from '@/features/wizard/steps/StepPlot'
import { StepHero } from '@/features/wizard/steps/StepHero'
import { StepPhoto } from '@/features/wizard/steps/StepPhoto'
import { StepCasting } from '@/features/wizard/steps/StepCasting'
import { StepScenes } from '@/features/wizard/steps/StepScenes'
import { StepPayment } from '@/features/wizard/steps/StepPayment'
import { StepDone } from '@/features/wizard/steps/StepDone'

const STEP_VIEWS = {
  plot: StepPlot,
  hero: StepHero,
  photo: StepPhoto,
  casting: StepCasting,
  scenes: StepScenes,
  payment: StepPayment,
  done: StepDone,
} as const

export function CreatePage() {
  const navigate = useNavigate()
  const step = useWizard((s) => s.step)
  const goBack = useWizard((s) => s.goBack)
  const reset = useWizard((s) => s.reset)
  const stepIndex = STEP_ORDER.indexOf(step)
  const StepView = STEP_VIEWS[step]
  const isFinal = step === 'done'

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 flex items-center gap-3 pt-2">
        {stepIndex > 0 && !isFinal ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Назад"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full paper transition-colors hover:bg-paper-shade"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-10 w-10 shrink-0" />
        )}
        <div className="flex-1">
          {!isFinal && (
            <Progress
              value={((stepIndex + 1) / (STEP_ORDER.length - 1)) * 100}
              label={`Шаг ${stepIndex + 1} из ${STEP_ORDER.length - 1}`}
            />
          )}
        </div>
        <button
          type="button"
          aria-label="Закрыть мастер"
          onClick={() => {
            reset()
            navigate(ROUTES.home)
          }}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full paper transition-colors hover:bg-paper-shade"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <StepView />
    </div>
  )
}
