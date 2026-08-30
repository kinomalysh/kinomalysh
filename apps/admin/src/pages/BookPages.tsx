import { useEffect, useRef, useState } from 'react'
import { api } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Button, Card, cn, ErrorText, Field, Spinner, Textarea } from '@/shared/ui'

export interface BookPage {
  id: string
  position: number
  text: string
  textFemale: string | null
  prompt: string
  promptFemale: string | null
  sampleUrl: string | null
  sampleStatus: string
  approvedUrl: string | null
  approvedAt: string | null
  failReason: string | null
}

const ACTIVE = new Set(['queued', 'rendering'])

export function BookPages({ productId }: { productId: string }) {
  const { data, loading, error, reload } = useAsync(
    () => api<{ pages: BookPage[] }>(`/admin/products/${productId}/pages`),
    [productId],
  )
  const pages = data?.pages ?? []
  const hasActive = pages.some((p) => ACTIVE.has(p.sampleStatus))

  const reloadRef = useRef(reload)
  reloadRef.current = reload
  useEffect(() => {
    if (!hasActive) return
    const t = setInterval(() => reloadRef.current(), 5000)
    return () => clearInterval(t)
  }, [hasActive])

  const [adding, setAdding] = useState(false)
  const addPage = async () => {
    setAdding(true)
    try {
      await api(`/admin/products/${productId}/pages`, { method: 'POST', body: {} })
      reload()
    } finally {
      setAdding(false)
    }
  }

  const approvedCount = pages.filter((p) => p.approvedUrl).length

  if (loading) return <Spinner />

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">Страницы книги</h2>
          <p className="text-sm text-ink-3">
            {pages.length === 0
              ? 'Пока ни одной страницы'
              : `${approvedCount} из ${pages.length} утверждено`}
          </p>
        </div>
        <Button onClick={addPage} loading={adding}>
          Добавить страницу
        </Button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {pages.length === 0 && (
        <p className="rounded-xl bg-surface-2 px-3 py-4 text-sm text-ink-3">
          В карточку товара попадают только утверждённые страницы. Добавьте текст и промпт, затем
          утвердите образец
        </p>
      )}

      <div className="space-y-4">
        {pages.map((page) => (
          <PageRow key={page.id} page={page} onChanged={reload} />
        ))}
      </div>
    </Card>
  )
}

const TAG_TONES = {
  ok: 'bg-leaf/15 text-leaf',
  warn: 'bg-mustard/20 text-mustard-deep',
  muted: 'bg-ink-3/15 text-ink-2',
} as const

function Tag({ tone, children }: { tone: keyof typeof TAG_TONES; children: string }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', TAG_TONES[tone])}>
      {children}
    </span>
  )
}

function PageRow({ page, onChanged }: { page: BookPage; onChanged: () => void }) {
  const [text, setText] = useState(page.text)
  const [prompt, setPrompt] = useState(page.prompt)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const dirty = text !== page.text || prompt !== page.prompt

  const save = async () => {
    setBusy(true)
    setErr('')
    try {
      await api(`/admin/pages/${page.id}`, { method: 'PATCH', body: { text, prompt } })
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не сохранилось')
    } finally {
      setBusy(false)
    }
  }

  const approve = async () => {
    setBusy(true)
    setErr('')
    try {
      await api(`/admin/pages/${page.id}/approve`, { method: 'POST' })
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось утвердить')
    } finally {
      setBusy(false)
    }
  }

  const generate = async () => {
    setBusy(true)
    setErr('')
    try {
      await api(`/admin/pages/${page.id}/generate`, { method: 'POST' })
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось запустить')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api(`/admin/pages/${page.id}`, { method: 'DELETE' })
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  const rendering = ACTIVE.has(page.sampleStatus)
  const preview = page.approvedUrl ?? page.sampleUrl

  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="font-display text-lg">Страница {page.position}</span>
        <Tag tone={page.approvedUrl ? 'ok' : 'muted'}>
          {page.approvedUrl ? 'Утверждена' : 'Черновик'}
        </Tag>
        {dirty && <Tag tone="warn">Не сохранено</Tag>}
        {rendering && <Tag tone="warn">Рисуется</Tag>}
      </div>

      <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="aspect-square overflow-hidden rounded-xl bg-surface-2">
          {preview ? (
            <img
              src={preview}
              alt={`Образец страницы ${page.position}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs text-ink-3">нет образца</div>
          )}
        </div>

        <div className="space-y-3">
          <Field
            label="Текст сказки"
            hint="Ложится поверх иллюстрации. Имя ребёнка подставляется автоматически"
          >
            <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Field
            label="Промпт иллюстрации"
            hint="Один момент, без описания камеры. Запрет надписей добавляется автоматически"
          >
            <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Field>

          {page.failReason && <ErrorText>{page.failReason}</ErrorText>}
          {err && <ErrorText>{err}</ErrorText>}

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} loading={busy} disabled={!dirty}>
              Сохранить
            </Button>
            <Button
              variant="ghost"
              onClick={generate}
              disabled={busy || dirty || !page.prompt.trim()}
            >
              {rendering ? 'Рисуется…' : page.sampleUrl ? 'Перерисовать' : 'Нарисовать образец'}
            </Button>
            <Button
              variant="ghost"
              onClick={approve}
              disabled={busy || !page.sampleUrl}
            >
              Утвердить образец
            </Button>
            <Button variant="danger" onClick={remove} disabled={busy}>
              Удалить
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
