import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/shared/api'
import { LazyVideo } from '@/shared/LazyVideo'
import { SamplePhoto } from '@/shared/SamplePhoto'
import { useAsync } from '@/shared/useAsync'
import { BookPages } from './BookPages'
import { Button, Card, cn, ErrorText, Field, Input, Spinner, Textarea } from '@/shared/ui'

type SceneKind = 'hero' | 'library' | 'title'

interface Scene {
  id: string
  productId: string
  position: number
  kind: SceneKind
  title: string | null
  prompt: string
  promptFemale: string | null
  voiceoverText: string | null
  voiceoverTextFemale: string | null
  motionPrompt: string | null
  clipStatus: string
  voStatus: string
  frameUrl: string | null
  clipUrl: string | null
  voUrl: string | null
  failReason: string | null
  updatedAt: string
  approvedAt: string | null
  personalized: boolean
  approvedClipUrl: string | null
  approvedVoUrl: string | null
  isLatestApproved: boolean
}

interface Product {
  id: string
  slug: string
  title: string
  tagline: string | null
  description: string | null
  priceTokens: number
  status: string
  kind: 'video' | 'book'
}

interface Readiness {
  canPublish: boolean
  blockers: string[]
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
const STAGE_HINT: Record<string, string> = {
  queued: 'Ждём свободный слот воркера',
  framing: 'nano-banana рисует первый кадр по фото ребёнка',
  animating: 'PixVerse оживляет кадр - это самый долгий шаг, 2-5 минут',
  generating: 'ElevenLabs синтезирует речь',
}

function clipStages(kind: SceneKind): Array<{ key: string; label: string }> {
  const stages = [{ key: 'queued', label: 'Очередь' }]
  if (kind === 'hero') stages.push({ key: 'framing', label: 'Кадр' })
  stages.push({ key: 'animating', label: kind === 'hero' ? 'Оживление' : 'Генерация' })
  stages.push({ key: 'ready', label: 'Готово' })
  return stages
}

const VO_STAGES = [
  { key: 'queued', label: 'Очередь' },
  { key: 'generating', label: 'Синтез' },
  { key: 'ready', label: 'Готово' },
]

function useElapsed(startIso: string): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000))
}

function fmtElapsed(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function StageBar({
  stages,
  status,
  since,
  frameUrl,
}: {
  stages: Array<{ key: string; label: string }>
  status: string
  since: string
  frameUrl?: string | null
}) {
  const currentIdx = stages.findIndex((s) => s.key === status)
  const elapsed = useElapsed(since)

  return (
    <div className="mt-3 rounded-xl border border-gold/25 bg-surface-2/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Spinner />
          {STAGE_HINT[status] ?? 'Работаем…'}
        </span>
        <span className="tabular-nums text-xs text-ink-3">на этапе {fmtElapsed(elapsed)}</span>
      </div>

      <div className="mt-3 flex items-end gap-2">
        {stages.map((s, i) => {
          const done = currentIdx > i
          const active = currentIdx === i
          return (
            <div key={s.key} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-line">
                {done && <span className="absolute inset-0 rounded-full bg-leaf" />}
                {active && (
                  <span className="absolute inset-y-0 w-1/2 rounded-full bg-gold [animation:km-progress_1.3s_ease-in-out_infinite]" />
                )}
              </span>
              <span className={cn('text-[11px]', active ? 'text-gold' : done ? 'text-leaf' : 'text-ink-3')}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {frameUrl && (
        <div className="relative mt-3 inline-block overflow-hidden rounded-lg">
          <img src={frameUrl} alt="Кадр сцены" className="h-40 rounded-lg" />
          <span className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent [animation:km-shimmer_1.8s_linear_infinite]" />
        </div>
      )}
    </div>
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
  const [promptFemale, setPromptFemale] = useState(scene.promptFemale ?? '')
  const [vo, setVo] = useState(scene.voiceoverText ?? '')
  const [voFemale, setVoFemale] = useState(scene.voiceoverTextFemale ?? '')
  const [motion, setMotion] = useState(scene.motionPrompt ?? '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const dirty =
    kind !== scene.kind ||
    title !== (scene.title ?? '') ||
    prompt !== scene.prompt ||
    promptFemale !== (scene.promptFemale ?? '') ||
    vo !== (scene.voiceoverText ?? '') ||
    voFemale !== (scene.voiceoverTextFemale ?? '') ||
    motion !== (scene.motionPrompt ?? '')

  const clipBusy = CLIP_ACTIVE.has(scene.clipStatus)
  const voBusy = VO_ACTIVE.has(scene.voStatus)
  const approved = Boolean(scene.approvedAt)

  const setApproved = async (value: boolean) => {
    setSaving(true)
    setErr('')
    try {
      await api(`/admin/scenes/${scene.id}/approve`, { method: 'POST', body: { approved: value } })
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

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
          promptFemale: promptFemale || null,
          voiceoverText: vo || null,
          voiceoverTextFemale: voFemale || null,
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
          <Field label="Промпт генерации (сцена) - мальчик / по умолчанию">
            <Textarea rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </Field>
          {kind === 'hero' && (
            <Field label="Промпт генерации - девочка (необязательно)">
              <Textarea
                rows={3}
                value={promptFemale}
                onChange={(e) => setPromptFemale(e.target.value)}
                placeholder="Пусто = берётся промпт по умолчанию"
              />
              <p className="mt-1 text-xs text-ink-3">
                Заполните, если промпт по умолчанию описывает внешность/пол ребёнка текстом (например
                «a little boy») - иначе модель может проигнорировать фото клиентки
              </p>
            </Field>
          )}
          <Field label="Текст озвучки - мальчик / по умолчанию">
            <Textarea rows={2} value={vo} onChange={(e) => setVo(e.target.value)} placeholder="[warmly] …" />
            <p className="mt-1 text-xs text-ink-3">
              Имя ребёнка - плейсхолдером с падежом:{' '}
              <code className="text-gold">{'{имя}'}</code>{' '}
              <code className="text-gold">{'{имя:род}'}</code>{' '}
              <code className="text-gold">{'{имя:дат}'}</code>{' '}
              <code className="text-gold">{'{имя:вин}'}</code>{' '}
              <code className="text-gold">{'{имя:тв}'}</code>{' '}
              <code className="text-gold">{'{имя:пр}'}</code>. Пример:{' '}
              <span className="text-ink-2">{'{имя:дат} казалось, что это долго'}</span>
            </p>
            {scene.personalized && (
              <p className="mt-1 text-xs text-accent">
                Сцена персональная: озвучка синтезируется под каждого клиента, а не берётся общей
                Пример ниже - на тестовом имени
              </p>
            )}
          </Field>
          {kind === 'hero' && (
            <Field label="Текст озвучки - девочка (необязательно)">
              <Textarea
                rows={2}
                value={voFemale}
                onChange={(e) => setVoFemale(e.target.value)}
                placeholder="Пусто = берётся текст по умолчанию"
              />
              <p className="mt-1 text-xs text-ink-3">
                Заполните, если в тексте есть род глаголов/местоимений («он вздыхал») - плейсхолдер{' '}
                <code className="text-gold">{'{имя}'}</code> сам род не меняет.
              </p>
            </Field>
          )}
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
        {dirty && approved && (
          <span className="text-xs text-berry">Сохранение снимет утверждение и мастер-клип</span>
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

      {clipBusy && (
        <StageBar
          stages={clipStages(scene.kind)}
          status={scene.clipStatus}
          since={scene.updatedAt}
          frameUrl={scene.clipStatus === 'animating' ? scene.frameUrl : null}
        />
      )}
      {voBusy && <StageBar stages={VO_STAGES} status={scene.voStatus} since={scene.updatedAt} />}

      {scene.approvedClipUrl && (
        <div className="rounded-xl border border-leaf/40 bg-leaf/5 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-leaf">✓ Утверждённый пример</span>
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-3">
              {scene.kind === 'hero'
                ? 'видео уникальное, по фото ребёнка'
                : scene.personalized
                  ? 'видео общее, озвучка уникальная'
                  : 'одинаковый у всех заказов'}
            </span>
            {scene.approvedAt && (
              <span className="text-xs text-ink-3">
                {new Date(scene.approvedAt).toLocaleString('ru-RU', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            )}
            <Button variant="ghost" loading={saving} onClick={() => setApproved(false)}>
              Снять утверждение
            </Button>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <LazyVideo
              src={scene.approvedClipUrl}
              poster={scene.frameUrl}
              className="h-40 w-64 max-w-full rounded-lg"
            />
            {scene.approvedVoUrl && (
              <div className="space-y-1">
                <p className="text-xs text-ink-3">Утверждённая озвучка</p>
                <audio src={scene.approvedVoUrl} controls preload="none" className="h-9" />
              </div>
            )}
          </div>
          {scene.kind === 'hero' && (
            <p className="mt-3 text-xs text-ink-3">
              Клиенту сцена соберётся заново по его фото - здесь пример на тестовом ребёнке,
              он подтверждает, что промпт проходит фильтр и даёт нужный результат
            </p>
          )}
        </div>
      )}

      {(scene.clipUrl || scene.voUrl) && !scene.isLatestApproved && (
        <div className="rounded-xl border border-line bg-surface-2/40 p-4">
          <p className="mb-3 text-sm font-semibold">
            {approved ? 'Новый прогон - сравните с утверждённым' : 'Последний прогон'}
          </p>
          <div className="flex flex-wrap items-start gap-4">
            {scene.clipUrl && (
              <LazyVideo
                src={scene.clipUrl}
                poster={scene.frameUrl}
                className="h-40 w-64 max-w-full rounded-lg"
              />
            )}
            {scene.voUrl && (
              <div className="space-y-1">
                <p className="text-xs text-ink-3">Озвучка</p>
                <audio src={scene.voUrl} controls preload="none" className="h-9" />
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
            <Button loading={saving} onClick={() => setApproved(true)}>
              {approved ? 'Утвердить этот вариант' : 'Утвердить сцену'}
            </Button>
            <span className="text-xs text-ink-3">
              {approved
                ? 'Заменит утверждённый пример - именно он идёт клиентам'
                : 'Без утверждения продукт не выкатить'}
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}

function ProductSettings({ product, onChanged }: { product: Product; onChanged: () => void }) {
  const { data: readiness, reload: reloadReadiness } = useAsync(
    () => api<Readiness>(`/admin/products/${product.id}/readiness`),
    [product.id],
  )
  const [description, setDescription] = useState(product.description ?? '')
  const [price, setPrice] = useState(String(product.priceTokens))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [note, setNote] = useState('')

  const dirty = description !== (product.description ?? '') || price !== String(product.priceTokens)

  const patch = async (body: Record<string, unknown>, okNote: string) => {
    setBusy(true)
    setErr('')
    setNote('')
    try {
      await api(`/admin/products/${product.id}`, { method: 'PATCH', body })
      setNote(okNote)
      onChanged()
      reloadReadiness()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  const buildMasters = async () => {
    setBusy(true)
    setErr('')
    try {
      const res = await api<{ queued: number }>(`/admin/products/${product.id}/masters`, {
        method: 'POST',
      })
      setNote(res.queued ? `В очередь поставлено задач: ${res.queued}` : 'Все прогоны уже есть')
      onChanged()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Витрина</h2>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs',
            product.status === 'active' ? 'bg-leaf/15 text-leaf' : 'bg-surface-2 text-ink-3',
          )}
        >
          {product.status === 'active' ? 'опубликован' : product.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_180px]">
        <Field label="Описание для клиента">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Цена, токенов">
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
      </div>

      {readiness && !readiness.canPublish && (
        <div className="rounded-xl border border-berry/30 bg-berry/5 p-3 text-sm">
          <p className="font-medium text-berry">Публиковать нельзя, пока не закрыто:</p>
          <ul className="mt-1 list-disc pl-5 text-ink-2">
            {readiness.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
        {dirty && (
          <Button
            loading={busy}
            onClick={() =>
              patch(
                { description: description || null, priceTokens: Number(price) || 0 },
                'Сохранено',
              )
            }
          >
            Сохранить
          </Button>
        )}
        <Button variant="ghost" loading={busy} onClick={buildMasters}>
          Прогнать все сцены
        </Button>
        {product.status === 'active' ? (
          <Button
            variant="ghost"
            loading={busy}
            onClick={() => patch({ status: 'draft' }, 'Снят с витрины')}
          >
            Снять с витрины
          </Button>
        ) : (
          <Button
            variant="ghost"
            loading={busy}
            disabled={!readiness?.canPublish}
            onClick={() => patch({ status: 'active' }, 'Опубликован')}
          >
            Опубликовать
          </Button>
        )}
        {note && <span className="text-xs text-leaf">{note}</span>}
      </div>
      <ErrorText>{err}</ErrorText>
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
  if (!data) return <p className="text-berry">{error ?? 'Продукт не найден'}</p>

  return (
    <div className="space-y-6">
      <Link to="/products" className="text-sm text-ink-3 hover:text-ink">
        ← Продукты
      </Link>

      <div>
        <h1 className="font-display text-3xl">{data.product.title}</h1>
        {data.product.tagline && <p className="text-sm text-ink-3">{data.product.tagline}</p>}
      </div>

      <ProductSettings product={data.product} onChanged={reload} />

      {data.product.kind === 'book' && <BookPages productId={data.product.id} />}

      <SamplePhoto
        slug="sample-child"
        label="Тестовое фото ребёнка"
        hint="Нужно для превью геройских сцен. Одно на всю студию"
        fallbackEmoji="🙂"
      />

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
