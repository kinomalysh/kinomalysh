import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Card, Input, Spinner } from '@/shared/ui'

interface UserRow {
  id: string
  email: string
  name: string
  balance: number
  emailVerified: boolean
  createdAt: string
}

interface UsersResponse {
  users: UserRow[]
  total: number
  page: number
  pageSize: number
}

export function UsersPage() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const { data, loading, error } = useAsync(
    () => api<UsersResponse>(`/admin/users?page=${page}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
    [q, page],
  )
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Пользователи</h1>
      <Input
        placeholder="Поиск по email или имени"
        value={q}
        onChange={(e) => {
          setPage(1)
          setQ(e.target.value)
        }}
        className="max-w-xs"
      />

      <Card className="p-0">
        {loading ? (
          <div className="p-6">
            <Spinner />
          </div>
        ) : error ? (
          <p className="p-6 text-berry">{error}</p>
        ) : !data || data.users.length === 0 ? (
          <p className="p-6 text-ink-3">Ничего не найдено</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-3">
              <tr>
                <th className="px-5 py-3 font-medium">Имя</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Баланс</th>
                <th className="px-5 py-3 font-medium">Регистрация</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2/40">
                  <td className="px-5 py-3">
                    <Link to={`/users/${u.id}`} className="font-medium text-ink hover:text-gold">
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-ink-2">
                    {u.email}
                    {!u.emailVerified && <span className="ml-2 text-xs text-ink-3">(не подтверждён)</span>}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gold">{u.balance}</td>
                  <td className="px-5 py-3 text-ink-3">{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
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
