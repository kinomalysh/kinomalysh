import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X } from '@phosphor-icons/react'
import { ROUTES, TOKEN_TO_RUB } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { formatRub } from '@/shared/lib/format'
import { Progress } from '@/shared/ui/Progress'
import { cn } from '@/shared/lib/cn'
import { STEP_ORDER, STEP_TITLES, useWizard } from '@/features/wizard/model'
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
  const direction = useWizard((s) => s.direction)
  const goBack = useWizard((s) => s.goBack)
  const reset = useWizard((s) => s.reset)
  const product = useWizard((s) => s.product)
  const childName = useWizard((s) => s.childName)
  const gender = useWizard((s) => s.gender)
  const photoPreview = useWizard((s) => s.photoPreview)
  const status = useSession((s) => s.status)

  const stepIndex = STEP_ORDER.indexOf(step)

  const requireAuth = (): boolean => {
    if (status === 'authed') return true
    navigate(`${ROUTES.auth}?next=${encodeURIComponent(ROUTES.create)}`)
    return false
  }

  return (
    <div className="shell pt-4 lg:pt-10">
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-12">
        <div className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="mb-6 flex items-center gap-3">
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
              <div className="mb-2 hidden items-baseline justify-between lg:flex">
                <span className="font-display text-lg text-ink-900">{STEP_TITLES[step]}</span>
                <span className="text-xs text-ink-500">
                  шаг {stepIndex + 1} из {STEP_ORDER.length}
                </span>
              </div>
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
            {step === 'photo' && (
              <StepPhoto requireAuth={requireAuth} onSubmitted={() => undefined} />
            )}
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

        <aside className="sticky top-28 hidden lg:block">
          <div className="sticker rotate-[0.5deg] rounded-3xl p-6">
            <p className="hand-note rotate-[-1deg] text-lg">ваш заказ</p>

            {product ? (
              <>
                <p className="mt-2 font-display text-xl leading-snug text-ink-900">
                  {product.title}
                </p>
                <p className="mt-1 font-display text-lg text-mustard-deep">
                  {formatRub(product.priceTokens * TOKEN_TO_RUB)}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-800">Сказка пока не выбрана</p>
            )}

            <ul className="mt-5 space-y-3 border-t-2 border-dashed border-ink-900/15 pt-5">
              <SummaryRow
                label="Герой"
                value={
                  childName.trim()
                    ? `${childName.trim()}${gender ? (gender === 'male' ? ', мальчик' : ', девочка') : ''}`
                    : null
                }
              />
              <SummaryRow label="Фотография" value={photoPreview ? 'загружена' : null} />
              <SummaryRow
                label="Портрет героя"
                value={stepIndex > STEP_ORDER.indexOf('casting') ? 'выбран' : null}
              />
            </ul>

            {photoPreview && (
              <img
                src={photoPreview}
                alt=""
                className="mt-5 aspect-square w-full rounded-2xl border-2 border-ink-900/15 object-cover"
              />
            )}

            <p className="mt-5 text-xs leading-relaxed text-ink-500">
              Деньги списываются только на последнем шаге. До него всё бесплатно
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

interface SummaryRowProps {
  label: string
  value: string | null
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-ink-500">{label}</span>
      {value ? (
        <span className="flex items-center gap-1.5 font-semibold text-ink-900">
          <Check weight="bold" className="h-3.5 w-3.5 text-leaf" />
          {value}
        </span>
      ) : (
        <span className="text-ink-500/60">-</span>
      )}
    </li>
  )
}
