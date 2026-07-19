import { useNavigate } from 'react-router-dom'
import { Coins, LockKey } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { formatRub, formatTokens } from '@/shared/lib/format'
import { ROUTES, TOKEN_TO_RUB } from '@/shared/config/routes'
import { getPlot } from '@/entities/plot/model'
import { useUser } from '@/entities/user/model'
import { useWizard, wizardPrice } from '@/features/wizard/model'

export function StepPayment() {
  const navigate = useNavigate()
  const plotId = useWizard((s) => s.plotId)
  const format = useWizard((s) => s.format)
  const childName = useWizard((s) => s.childName)
  const pay = useWizard((s) => s.pay)
  const balance = useUser((s) => s.balance)
  const spend = useUser((s) => s.spend)
  const plot = getPlot(plotId ?? '')
  const price = wizardPrice({ format, plotId })
  const enough = balance >= price

  const handlePay = () => {
    if (spend(price)) pay()
  }

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Почти готово</h1>
        <p className="text-sm text-ink-800">
          Запускаем полную генерацию: все сцены, озвучка и монтаж
        </p>
      </header>

      <Card className="divide-y divide-ink-900/10">
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-ink-800">Сказка</span>
          <span className="text-sm font-medium text-ink-900">{plot?.title}</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-ink-800">Герой</span>
          <span className="text-sm font-medium text-ink-900">{childName.trim() || '—'}</span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-ink-800">Формат</span>
          <span className="text-sm font-medium text-ink-900">
            {format === 'video' ? 'Мультфильм ~2 мин' : 'Книга PDF + аудио'}
          </span>
        </div>
        <div className="flex items-center justify-between p-4">
          <span className="text-sm text-ink-800">Стоимость</span>
          <span className="text-right">
            <span className="block font-display text-lg text-mustard-deep">{formatTokens(price)}</span>
            <span className="text-[11px] text-ink-500">≈ {formatRub(price * TOKEN_TO_RUB)}</span>
          </span>
        </div>
      </Card>

      <div className="flex items-center justify-between rounded-2xl bg-white border border-ink-900/15 px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-ink-800">
          <Coins className="h-4 w-4 text-mustard-deep" />
          На балансе
        </span>
        <span className="text-sm font-semibold text-ink-900">{formatTokens(balance)}</span>
      </div>

      {enough ? (
        <Button size="lg" className="w-full" onClick={handlePay}>
          Создать сказку — {formatTokens(price)}
        </Button>
      ) : (
        <Button size="lg" className="w-full" onClick={() => navigate(ROUTES.profile)}>
          Пополнить баланс
        </Button>
      )}

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-500">
        <LockKey className="h-3.5 w-3.5" />
        Токены спишутся только после успешной генерации
      </p>
    </div>
  )
}
