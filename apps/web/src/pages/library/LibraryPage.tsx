import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, FilmSlate, Play, Plus, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { plural } from '@/shared/lib/format'
import { ROUTES } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { ApiError } from '@/shared/api/client'
import { useSession } from '@/entities/session/model'
import { fetchOrders, ORDER_STATUS_LABELS, type Order } from '@/entities/order/model'

const LIVE_STATUSES = new Set(['rendering', 'casting'])
const POLL_MS = 15000

export function LibraryPage() {
  useSeo('library')
  const navigate = useNavigate()
  const status = useSession((s) => s.status)
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setOrders(await fetchOrders())
      setError(null)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Библиотека не загрузилась')
    }
  }, [])

  useEffect(() => {
    if (status === 'anon') {
      navigate(`${ROUTES.auth}?next=${encodeURIComponent(ROUTES.library)}`, { replace: true })
      return
    }
    if (status === 'authed') void load()
  }, [status, load, navigate])

  useEffect(() => {
    if (!orders?.some((order) => LIVE_STATUSES.has(order.status))) return
    const timer = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [orders, load])

  return (
    <div className="space-y-5 pt-2 animate-rise">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink-900">Библиотека</h1>
          <p className="mt-1 text-sm text-ink-800">Готовые мультфильмы храним 30 дней</p>
        </div>
        <Button size="sm" onClick={() => navigate(ROUTES.create)}>
          <Plus className="h-4 w-4" />
          Новый
        </Button>
      </header>

      {error && (
        <Card className="flex items-start gap-3 p-4">
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
          <p className="text-sm text-ink-800">{error}</p>
        </Card>
      )}

      {orders === null && !error && (
        <ul className="space-y-3">
          {[0, 1].map((key) => (
            <li key={key} className="h-24 animate-pulse rounded-3xl bg-paper-shade" />
          ))}
        </ul>
      )}

      {orders?.length === 0 && (
        <Card className="p-10 text-center">
          <p className="font-display text-lg text-ink-900">Здесь пока пусто</p>
          <p className="mt-2 text-sm text-ink-800">
            Выберите мультфильм и загрузите фото - через 15 минут он будет на этой полке
          </p>
          <Button className="mt-5" onClick={() => navigate(ROUTES.create)}>
            Создать мультфильм
          </Button>
        </Card>
      )}

      {orders && orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map((order) => {
            const ready = order.status === 'ready'
            return (
              <li key={order.id}>
                <Card
                  interactive
                  onClick={() => navigate(ROUTES.story(order.id))}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-night-900">
                    {ready ? (
                      <Play weight="fill" className="h-5 w-5 text-cream" />
                    ) : (
                      <FilmSlate className="h-5 w-5 text-moon-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-medium text-ink-900">
                      {order.product?.title ?? 'Мультфильм'}
                      {order.childName ? ` · ${order.childName}` : ''}
                    </h2>
                    {order.status === 'rendering' && order.progress && (
                      <p className="mt-0.5 text-xs text-ink-500">
                        Готово на {order.progress.percent}%
                      </p>
                    )}
                    {ready && order.daysLeft !== null && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
                        <Clock className="h-3.5 w-3.5" />
                        ещё {order.daysLeft} {plural(order.daysLeft, 'день', 'дня', 'дней')}
                      </p>
                    )}
                    <span
                      className={cn(
                        'mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                        ready
                          ? 'bg-leaf/12 text-leaf'
                          : order.status === 'failed' || order.status === 'expired'
                            ? 'bg-berry/10 text-berry'
                            : 'bg-mustard/25 text-mustard-deep',
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
