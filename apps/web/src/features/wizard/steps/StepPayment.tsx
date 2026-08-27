import { useEffect, useState } from 'react'
import { CheckCircle, Coins, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { TOKEN_TO_RUB } from '@/shared/config/routes'
import { formatRub, formatTokens } from '@/shared/lib/format'
import { fetchPacks, startTopup, type Pack } from '@/entities/billing/model'
import { useSession } from '@/entities/session/model'
import { ApiError } from '@/shared/api/client'
import { useWizard } from '@/features/wizard/model'

const PENDING_ORDER_KEY = 'kinomalysh.pendingOrder'

interface StepPaymentProps {
  onPaid: (orderId: string) => void
}

export function StepPayment({ onPaid }: StepPaymentProps) {
  const order = useWizard((s) => s.order)
  const product = useWizard((s) => s.product)
  const pay = useWizard((s) => s.pay)
  const submitting = useWizard((s) => s.submitting)
  const error = useWizard((s) => s.error)
  const user = useSession((s) => s.user)
  const refreshUser = useSession((s) => s.refreshUser)

  const [packs, setPacks] = useState<Pack[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [topupError, setTopupError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const cost = order?.tokensCost ?? product?.priceTokens ?? 0
  const balance = user?.balance ?? 0
  const enough = balance >= cost

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  useEffect(() => {
    if (enough) return
    let alive = true
    fetchPacks()
      .then((list) => {
        if (!alive) return
        setPacks(list)
        const affordable = list.find((pack) => pack.tokens >= cost - balance)
        setSelected((current) => current ?? affordable?.id ?? list[0]?.id ?? null)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [enough, cost, balance])

  const handlePay = async () => {
    const paid = await pay()
    if (paid) {
      await refreshUser()
      onPaid(paid.id)
    }
  }

  const handleTopup = async () => {
    if (!selected) return
    setTopupError(null)
    setRedirecting(true)
    try {
      const { paymentUrl } = await startTopup(selected)
      if (!paymentUrl) {
        setTopupError('Платёжная страница не открылась - попробуйте ещё раз')
        setRedirecting(false)
        return
      }
      if (order) {
        try {
          window.localStorage.setItem(PENDING_ORDER_KEY, order.id)
        } catch {
          /* без запоминания просто вернёмся в библиотеку */
        }
      }
      window.location.href = paymentUrl
    } catch (caught) {
      setRedirecting(false)
      setTopupError(
        caught instanceof ApiError ? caught.message : 'Не получилось начать оплату, попробуйте позже',
      )
    }
  }

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Осталось оплатить</h1>
        <p className="text-sm text-ink-800">
          Списываем токены и сразу отправляем мультфильм в работу. Если сборка сорвётся - вернём
          токены автоматически
        </p>
      </header>

      <Card className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-ink-800">{product?.title ?? 'Мультфильм'}</span>
          <span className="font-display text-xl text-ink-900">
            {formatRub(cost * TOKEN_TO_RUB)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-3 border-t-2 border-dashed border-ink-900/15 pt-3">
          <span className="flex items-center gap-2 text-sm text-ink-800">
            <Coins className="h-4 w-4 text-mustard" />
            На балансе
          </span>
          <span className={cn('font-semibold', enough ? 'text-leaf' : 'text-berry')}>
            {formatTokens(balance)}
          </span>
        </div>
      </Card>

      {error && (
        <Card className="flex items-start gap-3 p-4">
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
          <p className="text-sm text-ink-800">{error}</p>
        </Card>
      )}

      {enough ? (
        <Button
          size="lg"
          className="w-full"
          loading={submitting}
          onClick={() => void handlePay()}
        >
          <CheckCircle className="h-5 w-5" />
          Оплатить {formatTokens(cost)}
        </Button>
      ) : (
        <section className="space-y-4">
          <p className="text-sm text-ink-800">
            Не хватает {formatTokens(cost - balance)} - пополните баланс, заказ сохранится
          </p>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Пакеты пополнения">
            {packs.map((pack, index) => (
              <button
                key={pack.id}
                type="button"
                role="radio"
                aria-checked={selected === pack.id}
                onClick={() => setSelected(pack.id)}
                className={cn(
                  'relative cursor-pointer rounded-2xl p-4 text-left transition-all duration-200',
                  selected === pack.id
                    ? cn('sticker scale-[1.02]', index % 2 === 0 ? 'rotate-[-1deg]' : 'rotate-[1deg]')
                    : 'paper hover:-translate-y-0.5',
                )}
              >
                {pack.badge && (
                  <span className="absolute -top-2.5 right-3 rounded-full border-2 border-ink-900 bg-poppy px-2 py-0.5 text-[9px] font-bold text-on-poppy">
                    {pack.badge}
                  </span>
                )}
                <span className="block text-xs font-semibold text-ink-800">{pack.label}</span>
                <span className="mt-1 block font-display text-xl text-ink-900">
                  {formatRub(pack.rub)}
                </span>
                <span className="mt-1.5 inline-block rounded-full bg-paper-shade px-2 py-0.5 text-[11px] font-bold text-ink-800">
                  {formatTokens(pack.tokens)}
                </span>
              </button>
            ))}
          </div>
          {topupError && (
            <Card className="flex items-start gap-3 p-4">
              <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
              <p className="text-sm text-ink-800">{topupError}</p>
            </Card>
          )}
          <Button
            size="lg"
            className="w-full"
            disabled={!selected}
            loading={redirecting}
            onClick={() => void handleTopup()}
          >
            Пополнить картой
          </Button>
        </section>
      )}
    </div>
  )
}
