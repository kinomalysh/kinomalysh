import { api } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Card, Spinner, STATUS_LABELS } from '@/shared/ui'

interface Dashboard {
  users: number
  stories: number
  readyLastWeek: number
  revenueMinor: number
  reels: number
  byStatus: Record<string, number>
}

export function DashboardPage() {
  const { data, loading, error } = useAsync(() => api<Dashboard>('/admin/dashboard'), [])

  if (loading) return <Spinner />
  if (error || !data) return <p className="text-berry">{error ?? 'Нет данных'}</p>

  const stats = [
    { label: 'Пользователей', value: data.users },
    { label: 'Заказов всего', value: data.stories },
    { label: 'Готово за неделю', value: data.readyLastWeek },
    { label: 'Выручка', value: `${(data.revenueMinor / 100).toLocaleString('ru-RU')} ₽` },
    { label: 'Рекламных роликов', value: data.reels },
  ]

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Дашборд</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-sm text-ink-3">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold text-ink">{s.value}</p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="mb-4 text-lg font-semibold">Заказы по статусам</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.byStatus).map(([status, n]) => (
            <div key={status} className="rounded-xl border border-line bg-surface-2 px-4 py-3">
              <p className="text-xs text-ink-3">{STATUS_LABELS[status] ?? status}</p>
              <p className="text-xl font-semibold">{n}</p>
            </div>
          ))}
          {Object.keys(data.byStatus).length === 0 && <p className="text-ink-3">Пока нет заказов</p>}
        </div>
      </Card>
    </div>
  )
}
