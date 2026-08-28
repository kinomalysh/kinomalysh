import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Badge, Card, Input, Spinner, STATUS_LABELS } from '@/shared/ui'

interface OrderRow {
  id: string
  status: string
  plotId: string | null
  childName: string | null
  format: string | null
  resultUrl: string | null
  createdAt: string
  userEmail: string | null
}

interface OrdersResponse {
  stories: OrderRow[]
  total: number
  page: number
  pageSize: number
}

const STATUS_FILTERS = ['', 'casting', 'awaiting_choice', 'awaiting_details', 'rendering', 'ready', 'failed']

export function OrdersPage() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error } = useAsync(
    () =>
      api<OrdersResponse>(
        `/admin/stories?page=${page}${status ? `&status=${status}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
      ),
    [q, status, page],
  )

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Заказы</h1>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Поиск по имени ребёнка"
          value={q}
          onChange={(e) => {
            setPage(1)
            setQ(e.target.value)
          }}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => {
                setPage(1)
                setStatus(s)
              }}
              className={`rounded-full px-3 py-1.5 text-sm ${status === s ? 'bg-accent text-white' : 'border border-line text-ink-2 hover:bg-surface-2'}`}
            >
              {s ? STATUS_LABELS[s] : 'Все'}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-0">
        {loading ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : error ? (
          <p className="p-6 text-berry">{error}</p>
        ) : !data || data.stories.length === 0 ? (
          <p className="p-6 text-ink-3">Ничего не найдено</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
              <tr>
                <th className="px-5 py-3 font-medium">Ребёнок</th>
                <th className="px-5 py-3 font-medium">Клиент</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Создан</th>
              </tr>
            </thead>
            <tbody>
              {data.stories.map((s) => (
                <tr key={s.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3">
                    <Link to={`/orders/${s.id}`} className="font-medium text-ink hover:text-gold">
                      {s.childName ?? '-'}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-2">{s.userEmail ?? '-'}</td>
                  <td className="px-5 py-3">
                    <Badge value={s.status} />
                  </td>
                  <td className="px-5 py-3 text-ink-3">
                    {new Date(s.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {pages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40">
            Назад
          </button>
          <span className="text-ink-3">
            {page} / {pages}
          </span>
          <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-line px-3 py-1.5 disabled:opacity-40">
            Вперёд
          </button>
        </div>
      )}
    </div>
  )
}
