import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getAccess } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Button, Card, cn, ErrorText, Field, Input, Spinner, Textarea } from '@/shared/ui'

type SceneKind = 'hero' | 'library' | 'title'

interface Scene {
  id: string
  productId: string
  position: number
  kind: SceneKind
  title: string | null
  prompt: string
  voiceoverText: string | null
  motionPrompt: string | null
  clipStatus: string
  voStatus: string
  clipUrl: string | null
  voUrl: string | null
  failReason: string | null
}

interface Product {
  id: string
  slug: string
  title: string
  tagline: string | null
  status: string
}

const KIND_LABEL: Record<SceneKind, string> = { hero: 'Герой', library: 'Библиотека', title: 'Титр' }
const KIND_TONE: Record<SceneKind, string> = {
  hero: 'bg-accent/15 text-accent',
  library: 'bg-leaf/15 text-leaf',
  title: 'bg-gold/15 text-gold',
}
const CLIP_ACTIVE = new Set(['queued', 'framing', 'animating'])
const VO_ACTIVE = new Set(['queued', 'generating'])
const STAGE_LABEL: Record<string, string> = {
  queued: 'в очереди',
  framing: 'строим кадр',
  animating: 'оживляем',
  generating: 'озвучиваем',
  ready: 'готово',
  failed: 'ошибка',
  idle: '',
}

function SampleChild() {
  const { data, reload } = useAsync(
    () => api<{ hasSample: boolean; url: string | null }>('/admin/settings/sample-child'),
    [],
  )
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setBusy(true)
    const form = new FormData()
    form.set('photo', file)
    try {
      await fetch('/api/admin/settings/sample-child', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAccess()}` },
        body: form,
      })
      reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex items-center gap-4">
      {data?.url ? (
        <img src={data.url} alt="Тест-ребёнок" className="h-16 w-16 rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-2xl">🙂</div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">Тестовое фото ребёнка</p>
        <p className="text-xs text-ink-3">Нужно для превью геройских сцен. Одно на всю студию.</p>
      </div>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button variant="ghost" loading={busy} onClick={() => ref.current?.click()}>
        {data?.hasSample ? 'Заменить' : 'Загрузить'}
      </Button>
    </Card>
  )
}

function SceneCard({
  scene,
  index,
  total,
  onChanged,
  onMove,
}: {
  scene: Scene
  index: number
  total: number
  onChanged: () => void
  onMove: (index: number, dir: -1 | 1) => void
}) {
  const [kind, setKind] = useState<SceneKind>(scene.kind)
  const [title, setTitle] = useState(scene.title ?? '')
  const [prompt, setPrompt] = useState(scene.prompt)
  const [vo, setVo] = useState(scene.voiceoverText ?? '')
  const [motion, setMotion] = useState(scene.motionPrompt ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const dirty =
    kind !== scene.kind ||
    title !== (scene.title ?? '') ||
    prompt !== scene.prompt ||
    vo !== (scene.voiceoverText ?? '') ||
    motion !== (scene.motionPrompt ?? '')

  const clipBusy = CLIP_ACTIVE.has(scene.clipStatus)
  const voBusy = VO_ACTIVE.has(scene.voStatus)

  const save = async () => {
    setSaving(true)
    setErr('')
    try {
      await api(`/admin/scenes/${scene.id}`, {
        method: 'PATCH',
        body: {
          kind,
          title: title || null,
          prompt,
          voiceoverText: vo || null,
          motionPrompt: motion || null,
        },
      })
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  const generate = async (target: 'clip' | 'vo') => {
    setErr('')
    try {
      if (dirty) await save()
      await api(`/admin/scenes/${scene.id}/generate`, { method: 'POST', body: { target } })
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  const remove = async () => {
    if (!confirm('Удалить сцену?')) return
    await api(`/admin/scenes/${scene.id}`, { method: 'DELETE' })
    onChanged()
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-3">#{index + 1}</span>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', KIND_TONE[kind])}>
            {KIND_LABEL[kind]}
          </span>
          {title && <span className="text-sm text-ink-2">{title}</span>}
        </div>
        <div className="flex items-center gap-1 text-ink-3">
          <button onClick={() => onMove(index, -1)} disabled={index === 0} className="rounded px-1.5 hover:text-ink disabled:opacity-30" title="Выше">
            ↑
          </button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="rounded px-1.5 hover:text-ink disabled:opacity-30" title="Ниже">
            ↓
          </button>
          <button onClick={remove} className="rounded px-1.5 hover:text-berry" title="Удалить">
            ✕
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[160px_1fr]">
        <div className="space-y-3">
          <Field label="Тип сцены">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as SceneKind)}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-line-strong"
            >
              <option value="hero">Герой (лицо ребёнка)</option>
              <option value="library">Библиотека (общая)</option>
              <option value="title">Титр</option>
            </select>
          </Field>
          <Field label="Название сцены">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Знакомство" />
          </Field>
        </div>
        <div className="space-y-3">
          <Field label="Промпт генерации (сцена)">
            <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Field>
          <Field label="Текст озвучки">
            <Textarea rows={2} value={vo} onChange={(e) => setVo(e.target.value)} placeholder="[warmly] …" />
          </Field>
          {kind === 'hero' && (
            <Field label="Движение камеры (необязательно)">
              <Input value={motion} onChange={(e) => setMotion(e.target.value)} placeholder="slow push-in" />
            </Field>
          )}
        </div>
      </div>

      <ErrorText>{err}</ErrorText>
      {scene.failReason && <p className="text-sm text-berry">Ошибка генерации: {scene.failReason}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
        {dirty && (
          <Button onClick={save} loading={saving}>
            Сохранить
          </Button>
        )}
        <Button variant="ghost" loading={clipBusy} onClick={() => generate('clip')} disabled={kind === 'title'}>
          {scene.clipUrl ? 'Заменить клип' : 'Сгенерировать клип'}
        </Button>
        {clipBusy && <span className="text-xs text-gold">клип: {STAGE_LABEL[scene.clipStatus]}…</span>}
        <Button variant="ghost" loading={voBusy} onClick={() => generate('vo')} disabled={!vo.trim()}>
          {scene.voUrl ? 'Переозвучить' : 'Озвучить'}
        </Button>
        {voBusy && <span className="text-xs text-gold">озвучка: {STAGE_LABEL[scene.voStatus]}…</span>}
      </div>

      {(scene.clipUrl || scene.voUrl) && (
        <div className="flex flex-wrap items-start gap-4 pt-1">
          {scene.clipUrl && <video src={scene.clipUrl} controls className="max-h-52 rounded-lg" />}
          {scene.voUrl && (
            <div className="space-y-1">
              <p className="text-xs text-ink-3">Озвучка</p>
              <audio src={scene.voUrl} controls className="h-9" />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, reload } = useAsync(
    () => api<{ product: Product; scenes: Scene[] }>(`/admin/products/${id}`),
    [id],
  )
  const scenes = data?.scenes ?? []
  const hasActive = scenes.some((s) => CLIP_ACTIVE.has(s.clipStatus) || VO_ACTIVE.has(s.voStatus))

  const reloadRef = useRef(reload)
  reloadRef.current = reload
  useEffect(() => {
    if (!hasActive) return
    const t = setInterval(() => reloadRef.current(), 5000)
    return () => clearInterval(t)
  }, [hasActive])

  const [adding, setAdding] = useState(false)

  const addScene = async (kind: SceneKind) => {
    setAdding(true)
    try {
      await api(`/admin/products/${id}/scenes`, { method: 'POST', body: { kind } })
      reload()
    } finally {
      setAdding(false)
    }
  }

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...scenes]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    await api(`/admin/products/${id}/scenes/reorder`, {
      method: 'POST',
      body: { orderedIds: next.map((s) => s.id) },
    })
    reload()
  }

  if (loading) return <Spinner />
  if (error || !data) return <p className="text-berry">{error ?? 'Продукт не найден'}</p>

  return (
    <div className="space-y-6">
      <Link to="/products" className="text-sm text-ink-3 hover:text-ink">
        ← Продукты
      </Link>

      <div>
        <h1 className="font-display text-3xl">{data.product.title}</h1>
        {data.product.tagline && <p className="text-sm text-ink-3">{data.product.tagline}</p>}
      </div>

      <SampleChild />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Сцены ({scenes.length})</h2>
        {hasActive && (
          <span className="flex items-center gap-2 text-xs text-ink-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-leaf" /> идёт генерация…
          </span>
        )}
      </div>

      <div className="space-y-4">
        {scenes.map((s, i) => (
          <SceneCard key={s.id} scene={s} index={i} total={scenes.length} onChanged={reload} onMove={move} />
        ))}
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink-3">Добавить сцену:</span>
        <Button variant="ghost" loading={adding} onClick={() => addScene('hero')}>
          + Герой
        </Button>
        <Button variant="ghost" loading={adding} onClick={() => addScene('library')}>
          + Библиотека
        </Button>
        <Button variant="ghost" loading={adding} onClick={() => addScene('title')}>
          + Титр
        </Button>
      </Card>
    </div>
  )
}
