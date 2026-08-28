import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Button, Card, ErrorText, Field, Input, Spinner } from '@/shared/ui'

interface ProductRow {
  id: string
  slug: string
  title: string
  tagline: string | null
  status: string
  scenes: number
  updatedAt: string
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Черновик',
  active: 'Активен',
  archived: 'В архиве',
}

export function ProductsPage() {
  const { data, loading, error, reload } = useAsync(
    () => api<{ products: ProductRow[] }>('/admin/products'),
    [],
  )
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState('')

  const create = async () => {
    setFormErr('')
    if (!title.trim() || !slug.trim()) return setFormErr('Заполните название и slug')
    setBusy(true)
    try {
      await api('/admin/products', { method: 'POST', body: { title: title.trim(), slug: slug.trim() } })
      setTitle('')
      setSlug('')
      setCreating(false)
      reload()
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Продукты</h1>
        <Button onClick={() => setCreating((v) => !v)}>{creating ? 'Отмена' : '+ Новый продукт'}</Button>
      </div>

      {creating && (
        <Card className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Название">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Тёма и волшебная щётка" />
            </Field>
            <Field label="Slug (латиница)">
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="teeth-pilot" />
            </Field>
          </div>
          <ErrorText>{formErr}</ErrorText>
          <Button onClick={create} loading={busy}>
            Создать
          </Button>
        </Card>
      )}

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-berry">{error}</p>
      ) : !data || data.products.length === 0 ? (
        <Card>
          <p className="text-ink-3">Продуктов пока нет - создайте первый.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.products.map((p) => (
            <Link key={p.id} to={`/products/${p.id}`}>
              <Card className="h-full transition-colors hover:border-line-strong">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-ink">{p.title}</p>
                    {p.tagline && <p className="mt-0.5 text-sm text-ink-3">{p.tagline}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-2">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink-3">{p.scenes} сцен · {p.slug}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
