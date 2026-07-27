import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Button, Card, ErrorText, Field, Input, Spinner } from '@/shared/ui'

interface LedgerRow {
  id: string
  delta: number
  kind: string
  createdAt: string
}

interface UserDetail {
  user: {
    id: string
    email: string
    name: string
    balance: number
    emailVerified: boolean
    createdAt: string
  }
  ledger: LedgerRow[]
}

const KIND_LABELS: Record<string, string> = {
  hold: 'Списание за заказ',
  refund: 'Возврат',
  topup: 'Пополнение',
  admin: 'Корректировка админом',
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, reload } = useAsync(() => api<UserDetail>(`/admin/users/${id}`), [id])

  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [adjErr, setAdjErr] = useState('')

  if (loading) return <Spinner />
  if (error || !data) return <p className="text-berry">{error ?? 'Пользователь не найден'}</p>

  const { user, ledger } = data

  const adjust = async () => {
    const value = Number(delta)
    if (!Number.isInteger(value) || value === 0) {
      setAdjErr('Введите ненулевое целое число (можно со знаком минус)')
      return
    }
    setBusy(true)
    setAdjErr('')
    try {
      await api(`/admin/users/${user.id}/balance`, {
        method: 'POST',
        body: { delta: value, reason: reason || undefined },
      })
      setDelta('')
      setReason('')
      reload()
    } catch (e) {
      setAdjErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link to="/users" className="text-sm text-ink-3 hover:text-ink">
        ← Пользователи
      </Link>

      <div>
        <h1 className="font-display text-3xl">{user.name}</h1>
        <p className="text-sm text-ink-3">{user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <p className="text-sm text-ink-3">Текущий баланс</p>
          <p className="mt-1 text-4xl font-semibold text-gold">{user.balance}</p>
          <div className="mt-5 space-y-3 border-t border-line pt-5">
            <p className="text-sm font-semibold">Изменить баланс</p>
            <Field label="Токенов (+ начислить / − списать)">
              <Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="например, 100 или -50" />
            </Field>
            <Field label="Причина (необязательно)">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <ErrorText>{adjErr}</ErrorText>
            <Button onClick={adjust} loading={busy}>
              Применить
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">История токенов</h2>
          {ledger.length === 0 ? (
            <p className="text-ink-3">Пока нет операций</p>
          ) : (
            <ul className="space-y-2">
              {ledger.map((l) => (
                <li key={l.id} className="flex items-center justify-between border-b border-line/40 py-2 text-sm last:border-0">
                  <span className="text-ink-2">{KIND_LABELS[l.kind] ?? l.kind}</span>
                  <span className="flex items-center gap-3">
                    <span className={l.delta >= 0 ? 'text-leaf' : 'text-berry'}>
                      {l.delta >= 0 ? '+' : ''}
                      {l.delta}
                    </span>
                    <span className="text-ink-3">{new Date(l.createdAt).toLocaleDateString('ru-RU')}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
