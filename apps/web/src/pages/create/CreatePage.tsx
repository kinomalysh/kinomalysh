import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from '@phosphor-icons/react'
import { ROUTES } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { Progress } from '@/shared/ui/Progress'
import { STEP_ORDER, STEP_TITLES, useWizard } from '@/features/wizard/model'
import { cn } from '@/shared/lib/cn'
import { useSession } from '@/entities/session/model'
import { StepProduct } from '@/features/wizard/steps/StepProduct'
import { StepHero } from '@/features/wizard/steps/StepHero'
import { StepPhoto } from '@/features/wizard/steps/StepPhoto'
import { StepCasting } from '@/features/wizard/steps/StepCasting'
import { StepPayment } from '@/features/wizard/steps/StepPayment'

export function CreatePage() {
  useSeo('create')
  const navigate = useNavigate()
  const step = useWizard((s) => s.step)
  const goBack = useWizard((s) => s.goBack)
  const reset = useWizard((s) => s.reset)
  const status = useSession((s) => s.status)
  const direction = useWizard((s) => s.direction)

  const stepIndex = STEP_ORDER.indexOf(step)

  const requireAuth = (): boolean => {
    if (status === 'authed') return true
    navigate(`${ROUTES.auth}?next=${encodeURIComponent(ROUTES.create)}`)
    return false
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-5 flex items-center gap-3 pt-2">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={goBack}
            aria-label="Назад"
            className="paper flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-paper-shade"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-11 w-11 shrink-0" />
        )}
        <div className="flex-1">
          <Progress
            value={((stepIndex + 1) / STEP_ORDER.length) * 100}
            label={`${STEP_TITLES[step]} - шаг ${stepIndex + 1} из ${STEP_ORDER.length}`}
          />
        </div>
        <button
          type="button"
          aria-label="Закрыть мастер"
          onClick={() => {
            reset()
            navigate(ROUTES.home)
          }}
          className="paper flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-paper-shade"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div
        key={step}
        className={cn(direction === 'back' ? 'animate-step-back' : 'animate-step-forward')}
      >
        {step === 'product' && <StepProduct />}
        {step === 'hero' && <StepHero />}
        {step === 'photo' && <StepPhoto requireAuth={requireAuth} onSubmitted={() => undefined} />}
        {step === 'casting' && <StepCasting />}
        {step === 'payment' && (
          <StepPayment
            onPaid={(orderId) => {
              reset()
              navigate(ROUTES.story(orderId))
            }}
          />
        )}
      </div>
    </div>
  )
}
