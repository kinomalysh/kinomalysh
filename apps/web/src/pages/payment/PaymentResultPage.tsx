import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { ROUTES } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { formatTokens } from '@/shared/lib/format'
import { fetchPaymentStatus } from '@/entities/billing/model'
import { useSession } from '@/entities/session/model'

const PENDING_ORDER_KEY = 'kinomalysh.pendingOrder'
const POLL_MS = 3000
const MAX_POLLS = 20

type Outcome = 'pending' | 'succeeded' | 'failed'

export function PaymentResultPage() {
  useSeo('paymentResult')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const refreshUser = useSession((s) => s.refreshUser)

  const paymentId = params.get('paymentId')
  const [outcome, setOutcome] = useState<Outcome>('pending')
  const [tokens, setTokens] = useState(0)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    if (!paymentId || outcome !== 'pending' || attempts >= MAX_POLLS) return
    const timer = window.setTimeout(async () => {
      try {
        const payment = await fetchPaymentStatus(paymentId)
        setTokens(payment.tokens)
        if (payment.status === 'succeeded') {
          setOutcome('succeeded')
          await refreshUser()
        } else if (payment.status === 'failed' || payment.status === 'canceled') {
          setOutcome('failed')
        }
      } catch {
        /* подождём следующей попытки */
      }
      setAttempts((value) => value + 1)
    }, attempts === 0 ? 0 : POLL_MS)
    return () => window.clearTimeout(timer)
  }, [paymentId, outcome, attempts, refreshUser])

  const goBackToOrder = () => {
    let pending: string | null = null
    try {
      pending = window.localStorage.getItem(PENDING_ORDER_KEY)
      window.localStorage.removeItem(PENDING_ORDER_KEY)
    } catch {
      pending = null
    }
    navigate(pending ? ROUTES.story(pending) : ROUTES.library)
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-10 animate-rise">
      <Card className="space-y-4 p-8 text-center">
        {outcome === 'succeeded' ? (
          <>
            <CheckCircle weight="fill" className="mx-auto h-12 w-12 text-leaf" />
            <h1 className="font-display text-2xl text-ink-900">Токены зачислены</h1>
            <p className="text-sm text-ink-800">
              На баланс пришло {formatTokens(tokens)} - можно запускать мультфильм
            </p>
            <Button size="lg" className="w-full" onClick={goBackToOrder}>
              Вернуться к заказу
            </Button>
          </>
        ) : outcome === 'failed' ? (
          <>
            <WarningCircle weight="fill" className="mx-auto h-12 w-12 text-berry" />
            <h1 className="font-display text-2xl text-ink-900">Платёж не прошёл</h1>
            <p className="text-sm text-ink-800">
              Деньги не списаны. Попробуйте оплатить ещё раз
            </p>
            <Button size="lg" className="w-full" onClick={() => navigate(ROUTES.profile)}>
              Попробовать снова
            </Button>
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-mustard border-t-transparent"
            />
            <h1 className="font-display text-2xl text-ink-900">Проверяем платёж</h1>
            <p className="text-sm text-ink-800">
              {attempts >= MAX_POLLS
                ? 'Банк ещё думает. Токены придут автоматически - загляните в профиль через пару минут'
                : 'Это занимает несколько секунд'}
            </p>
            {attempts >= MAX_POLLS && (
              <Button size="lg" variant="secondary" className="w-full" onClick={goBackToOrder}>
                Хорошо
              </Button>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
