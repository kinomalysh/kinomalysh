import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CaretRight,
  Coins,
  FileText,
  Lifebuoy,
  ShieldCheck,
  SignOut,
  WarningCircle,
} from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { formatRub, formatTokens, plural } from '@/shared/lib/format'
import { BRAND, ROUTES } from '@/shared/config/routes'
import { asset } from '@/shared/lib/asset'
import { useSeo } from '@/shared/lib/seo'
import { ApiError } from '@/shared/api/client'
import { useSession } from '@/entities/session/model'
import {
  deleteAccount,
  fetchLedger,
  fetchPacks,
  fetchPayments,
  LEDGER_LABELS,
  type LedgerEntry,
  type Pack,
  type PaymentRecord,
} from '@/entities/billing/model'
import { usePaymentWatcher } from '@/entities/billing/usePaymentWatcher'

const PRICE_VIDEO_TOKENS = 199

const MENU = [
  {
    icon: Lifebuoy,
    label: 'Поддержка',
    hint: 'Отвечаем быстро, по-человечески',
    chip: 'bg-mustard/20 text-mustard',
    href: 'https://t.me/kinomalysh_help',
    to: null,
  },
  {
    icon: FileText,
    label: 'Пользовательское соглашение',
    hint: 'Коротко и без канцелярита',
    chip: 'bg-lilac-500/20 text-lilac-500',
    href: null,
    to: ROUTES.terms,
  },
  {
    icon: ShieldCheck,
    label: 'Мои данные',
    hint: 'Что храним и как удалить',
    chip: 'bg-leaf/15 text-leaf',
    href: null,
    to: ROUTES.privacy,
  },
]

export function ProfilePage() {
  useSeo('profile')
  const navigate = useNavigate()
  const status = useSession((s) => s.status)
  const user = useSession((s) => s.user)
  const logout = useSession((s) => s.logout)
  const refreshUser = useSession((s) => s.refreshUser)

  const [packs, setPacks] = useState<Pack[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const topup = usePaymentWatcher(() => void refreshUser())

  useEffect(() => {
    if (status === 'anon') {
      navigate(`${ROUTES.auth}?next=${encodeURIComponent(ROUTES.profile)}`, { replace: true })
      return
    }
    if (status !== 'authed') return
    void refreshUser()
    void fetchPacks().then((list) => {
      setPacks(list)
      setSelected((current) => current ?? list.find((pack) => pack.popular)?.id ?? list[0]?.id ?? null)
    })
    void fetchPayments().then(setPayments).catch(() => undefined)
    void fetchLedger().then(setLedger).catch(() => undefined)
  }, [status, navigate, refreshUser])

  const balance = user?.balance ?? 0
  const filmsLeft = Math.floor(balance / PRICE_VIDEO_TOKENS)
  const balanceNote =
    filmsLeft > 0
      ? `хватит на ${filmsLeft} ${plural(filmsLeft, 'мультфильм', 'мультфильма', 'мультфильмов')}`
      : 'пора подсыпать волшебства'

  const handleDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount()
      logout()
      navigate(ROUTES.home, { replace: true })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Не удалось удалить аккаунт')
    } finally {
      setBusy(false)
    }
  }

  if (status !== 'authed' || !user) {
    return <div className="h-64 animate-pulse rounded-3xl bg-paper-shade" />
  }

  return (
    <div className="space-y-8 pt-2 animate-rise">
      <section aria-label="Читательский билет" className="pt-2">
        <div className="sticker rotate-[-0.8deg] rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="hand-note rotate-[-1deg] text-lg">
              читательский билет {BRAND.toLowerCase()}а
            </p>
            <img src={asset('logo-wordmark.png')} alt={BRAND} className="h-7 w-auto shrink-0" />
          </div>
          <p className="mt-1 font-display text-2xl text-ink-900">{user.name}</p>
          <p className="text-xs text-ink-500">{user.email}</p>
          <div className="mt-4 border-t-2 border-dashed border-ink-900/15 pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-mustard" />
                <span className="font-display text-xl text-ink-900">{formatTokens(balance)}</span>
              </span>
              <span className="hand-note text-base">{balanceNote}</span>
            </div>
            <p className="mt-2 text-xs text-ink-500">Токены не сгорают</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="topup-heading" className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="hand-note shrink-0 rotate-[-2deg] text-lg">запасы</span>
          <h2 id="topup-heading" className="font-display text-xl text-ink-900">
            Пополнить волшебство
          </h2>
        </div>
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
              <span
                className={cn(
                  'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold',
                  selected === pack.id ? 'bg-mustard text-night-950' : 'bg-paper-shade text-ink-800',
                )}
              >
                {formatTokens(pack.tokens)}
              </span>
            </button>
          ))}
        </div>
        {(error || topup.error) && (
          <Card className="flex items-start gap-3 p-4">
            <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
            <p className="text-sm text-ink-800">{error ?? topup.error}</p>
          </Card>
        )}
        {topup.state === 'waiting' ? (
          <Card className="space-y-3 p-5 text-center">
            <span
              aria-hidden
              className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-mustard border-t-transparent"
            />
            <p className="text-sm text-ink-800">
              Оплата открылась в соседней вкладке. Токены зачислятся сюда сами
            </p>
            <Button variant="ghost" size="sm" onClick={topup.reset}>
              Выбрать другой пакет
            </Button>
          </Card>
        ) : topup.state === 'failed' ? (
          <Card className="space-y-3 p-5 text-center">
            <p className="text-sm text-ink-800">Платёж не прошёл, деньги не списаны</p>
            <Button variant="secondary" size="sm" onClick={topup.reset}>
              Попробовать снова
            </Button>
          </Card>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!selected}
            loading={topup.state === 'opening'}
            onClick={() => selected && void topup.start(selected)}
          >
            Пополнить картой
          </Button>
        )}
      </section>

      {ledger.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-ink-900">История токенов</h2>
          <ul className="space-y-2">
            {ledger.slice(0, 10).map((entry) => (
              <li
                key={entry.id}
                className="paper flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <span className="text-sm text-ink-800">
                  {LEDGER_LABELS[entry.kind] ?? entry.kind}
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    entry.delta > 0 ? 'text-leaf' : 'text-ink-900',
                  )}
                >
                  {entry.delta > 0 ? '+' : ''}
                  {entry.delta}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {payments.some((payment) => payment.status === 'pending') && (
        <section className="space-y-3">
          <h2 className="font-display text-xl text-ink-900">Незавершённые платежи</h2>
          {payments
            .filter((payment) => payment.status === 'pending')
            .map((payment) => (
              <Card key={payment.id} className="flex items-center justify-between gap-3 p-4">
                <span className="text-sm text-ink-800">
                  {formatRub(payment.amountRub)} · {formatTokens(payment.tokens)}
                </span>
                {payment.paymentUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      window.location.href = payment.paymentUrl as string
                    }}
                  >
                    Доплатить
                  </Button>
                )}
              </Card>
            ))}
        </section>
      )}

      <section aria-label="Настройки и помощь" className="space-y-3">
        <p className="hand-note rotate-[-1deg] text-lg">мелочи, но важные</p>
        <div className="space-y-2">
          {MENU.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.to) navigate(item.to)
                else if (item.href) window.open(item.href, '_blank', 'noopener,noreferrer')
              }}
              className="paper flex w-full cursor-pointer items-center gap-4 rounded-3xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  item.chip,
                )}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900">{item.label}</span>
                <span className="block text-xs text-ink-500">{item.hint}</span>
              </span>
              <CaretRight className="h-4 w-4 shrink-0 text-ink-500" />
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 border-t-2 border-dashed border-ink-900/15 pt-6">
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            logout()
            navigate(ROUTES.home)
          }}
        >
          <SignOut className="h-4 w-4" />
          Выйти
        </Button>
        {confirmDelete ? (
          <div className="space-y-2">
            <p className="text-xs text-ink-500">
              Удалим аккаунт, все заказы и фотографии. Отменить будет нельзя
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                className="flex-1"
                loading={busy}
                onClick={() => void handleDelete()}
              >
                Да, удалить
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(false)}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full cursor-pointer text-center text-xs text-ink-500 underline underline-offset-4"
          >
            Удалить аккаунт и данные
          </button>
        )}
      </section>
    </div>
  )
}
