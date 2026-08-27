import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, DownloadSimple, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Progress } from '@/shared/ui/Progress'
import { ROUTES } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { plural } from '@/shared/lib/format'
import { api, ApiError } from '@/shared/api/client'
import { useSession } from '@/entities/session/model'
import {
  fetchOrder,
  ORDER_STAGE_LABELS,
  payOrder,
  type Order,
} from '@/entities/order/model'

const POLL_MS = 6000
const LIVE_STATUSES = new Set(['rendering', 'casting'])

export function StoryPage() {
  useSeo('story')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const status = useSession((s) => s.status)
  const refreshUser = useSession((s) => s.refreshUser)

  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      setOrder(await fetchOrder(id))
      setError(null)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Не удалось загрузить заказ')
    }
  }, [id])

  useEffect(() => {
    if (status === 'anon') {
      navigate(`${ROUTES.auth}?next=${encodeURIComponent(ROUTES.story(id ?? ''))}`, {
        replace: true,
      })
      return
    }
    if (status === 'authed') void load()
  }, [status, load, navigate, id])

  useEffect(() => {
    if (!order || !LIVE_STATUSES.has(order.status)) return
    const timer = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [order, load])

  const handlePay = async () => {
    if (!id) return
    setBusy(true)
    try {
      setOrder(await payOrder(id))
      await refreshUser()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Оплата не прошла')
    } finally {
      setBusy(false)
    }
  }

  const handleDownload = async () => {
    if (!id) return
    setBusy(true)
    try {
      const { url } = await api<{ url: string }>(`/stories/${id}/download`)
      window.location.href = url
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Файл пока недоступен')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading' || (!order && !error)) {
    return <div className="h-64 animate-pulse rounded-3xl bg-paper-shade" />
  }

  return (
    <div className="space-y-5 pt-2 animate-rise">
      <Link
        to={ROUTES.library}
        className="inline-flex items-center gap-2 text-sm text-ink-800 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" />
        В библиотеку
      </Link>

      {error && (
        <Card className="flex items-start gap-3 p-4">
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
          <p className="text-sm text-ink-800">{error}</p>
        </Card>
      )}

      {order && (
        <>
          <header className="space-y-1">
            <h1 className="font-display text-2xl text-ink-900">
              {order.product?.title ?? 'Мультфильм'}
            </h1>
            {order.childName && (
              <p className="text-sm text-ink-800">Главный герой - {order.childName}</p>
            )}
          </header>

          {order.status === 'ready' && order.resultUrl && (
            <div className="space-y-4">
              <video
                src={order.resultUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-3xl border-2 border-ink-900/15 bg-night-950"
              />
              <Button
                size="lg"
                className="w-full"
                loading={busy}
                onClick={() => void handleDownload()}
              >
                <DownloadSimple className="h-5 w-5" />
                Скачать мультфильм
              </Button>
              {order.daysLeft !== null && (
                <p className="text-center text-xs text-ink-500">
                  Файл хранится ещё {order.daysLeft}{' '}
                  {plural(order.daysLeft, 'день', 'дня', 'дней')} - скачайте, чтобы сохранить
                  навсегда
                </p>
              )}
            </div>
          )}

          {order.status === 'rendering' && order.progress && (
            <Card className="space-y-4 p-6">
              <Progress value={order.progress.percent} label="Готовность мультфильма" />
              <div className="space-y-1">
                <p className="font-display text-lg text-ink-900">
                  {ORDER_STAGE_LABELS[order.progress.stage]}
                </p>
                {order.progress.total > 0 && (
                  <p className="text-sm text-ink-800">
                    Сцена {order.progress.done} из {order.progress.total}
                  </p>
                )}
                <p className="text-xs text-ink-500">
                  Обычно занимает 10-20 минут. Страницу можно закрыть - мультфильм появится в
                  библиотеке
                </p>
              </div>
            </Card>
          )}

          {order.status === 'awaiting_payment' && (
            <Card className="space-y-4 p-6">
              <p className="text-sm text-ink-800">
                Заказ ждёт оплаты. После списания токенов сборка начнётся сразу
              </p>
              <Button size="lg" className="w-full" loading={busy} onClick={() => void handlePay()}>
                Оплатить и запустить
              </Button>
            </Card>
          )}

          {order.status === 'failed' && (
            <Card className="space-y-3 p-6">
              <p className="font-display text-lg text-ink-900">Сборка не удалась</p>
              <p className="text-sm text-ink-800">
                {order.failReason ?? 'Что-то пошло не так на стороне генерации'}
              </p>
              <p className="text-sm text-leaf">Токены вернулись на баланс автоматически</p>
              <Button variant="secondary" onClick={() => navigate(ROUTES.create)}>
                Попробовать снова
              </Button>
            </Card>
          )}

          {order.status === 'expired' && (
            <Card className="space-y-3 p-6">
              <p className="font-display text-lg text-ink-900">Срок хранения истёк</p>
              <p className="text-sm text-ink-800">
                Мы храним готовые мультфильмы 30 дней, потом удаляем файл с серверов
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
