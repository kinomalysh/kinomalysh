import { useEffect, useRef, useState } from 'react'
import { api } from '@/shared/api'
import { LazyVideo } from '@/shared/LazyVideo'
import { SamplePhoto } from '@/shared/SamplePhoto'
import { useAsync } from '@/shared/useAsync'
import { Badge, Button, Card, cn, ErrorText, Field, Input, Spinner, Textarea } from '@/shared/ui'

type ReelKind = 't2v' | 'i2v'

interface Reel {
  id: string
  kind: ReelKind
  title: string | null
  scenePrompt: string
  status: string
  firstFrameUrl: string | null
  resultUrl: string | null
  downloadUrl: string | null
  stored?: boolean
  failReason: string | null
  createdAt: string
}

interface ReelsResponse {
  reels: Reel[]
  total: number
}

const ACTIVE = new Set(['queued', 'framing', 'animating'])

function stagesFor(kind: ReelKind): Array<{ key: string; label: string }> {
  const stages = [{ key: 'queued', label: 'Очередь' }]
  if (kind === 't2v') stages.push({ key: 'framing', label: 'Кадр' })
  stages.push({ key: 'animating', label: 'Оживление' })
  stages.push({ key: 'done', label: 'Готово' })
  return stages
}

function useElapsed(startIso: string, active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [active])
  return Math.max(0, Math.floor((now - new Date(startIso).getTime()) / 1000))
}

function fmtElapsed(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

function ReelProgress({ reel }: { reel: Reel }) {
  const stages = stagesFor(reel.kind)
  const currentIdx = stages.findIndex((s) => s.key === reel.status)
  const elapsed = useElapsed(reel.createdAt, true)

  return (
    <div className="mt-3 rounded-xl border border-gold/25 bg-surface-2/50 p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Spinner />
          {reel.status === 'framing' ? 'Строим Pixar-кадр…' : reel.status === 'animating' ? 'Оживляем сцену…' : 'В очереди…'}
        </span>
        <span className="tabular-nums text-xs text-ink-3">идёт {fmtElapsed(elapsed)}</span>
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

      {reel.firstFrameUrl && (
        <div className="relative mt-3 inline-block overflow-hidden rounded-lg">
          <img src={reel.firstFrameUrl} alt="Кадр" className="h-40 rounded-lg" />
          <span className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent [animation:km-shimmer_1.8s_linear_infinite]" />
        </div>
      )}
    </div>
  )
}

function ReelCard({ reel, onDelete }: { reel: Reel; onDelete: (id: string) => Promise<void> }) {
  const active = ACTIVE.has(reel.status)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(reel.scenePrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const remove = async () => {
    if (!confirm('Удалить ролик? Файл в хранилище тоже будет удалён')) return
    setDeleting(true)
    try {
      await onDelete(reel.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="[animation:km-fade-up_0.3s_ease-out]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-ink">{reel.title ?? 'Без названия'}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-ink-3">{reel.scenePrompt}</p>
          <p className="mt-1 text-xs text-ink-3">
            {reel.kind === 't2v' ? 'Рилс из фото' : 'Оживление сцены'} · {fmtDate(reel.createdAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge value={reel.status} />
          <button
            onClick={copyPrompt}
            title="Скопировать промпт"
            className="rounded-lg border border-line px-2 py-1 text-xs text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            {copied ? '✓ Скопировано' : 'Копировать промпт'}
          </button>
          {!active && (
            <button
              onClick={remove}
              disabled={deleting}
              title="Удалить"
              className="rounded-lg border border-line px-2 py-1 text-xs text-ink-3 hover:bg-berry/10 hover:text-berry disabled:opacity-50"
            >
              {deleting ? '…' : 'Удалить'}
            </button>
          )}
        </div>
      </div>

      {active && <ReelProgress reel={reel} />}

      {reel.status === 'failed' && reel.failReason && (
        <p className="mt-2 rounded-lg bg-berry/10 px-3 py-2 text-sm text-berry">{reel.failReason}</p>
      )}

      {reel.resultUrl && (
        <div className="mt-3">
          <LazyVideo
            src={reel.resultUrl}
            poster={reel.firstFrameUrl}
            className="h-40 w-full max-w-[220px] rounded-lg"
          />
          <div className="mt-2 flex items-center gap-4 text-sm">
            <a href={reel.downloadUrl ?? reel.resultUrl} className="text-gold hover:underline">
              Скачать ↓
            </a>
            {!reel.stored && <span className="text-xs text-ink-3">во временной ссылке fal</span>}
          </div>
        </div>
      )}
    </Card>
  )
}

export function ReelsPage() {
  const { data, reload } = useAsync(() => api<ReelsResponse>('/admin/reels?page=1'), [])
  const reels = data?.reels ?? []

  const hasActive = reels.some((r) => ACTIVE.has(r.status))
  const reloadRef = useRef(reload)
  reloadRef.current = reload
  useEffect(() => {
    if (!hasActive) return
    const t = setInterval(() => reloadRef.current(), 4000)
    return () => clearInterval(t)
  }, [hasActive])

  const [kind, setKind] = useState<ReelKind>('t2v')
  const [title, setTitle] = useState('')
  const [scenePrompt, setScenePrompt] = useState('')
  const [motionPrompt, setMotionPrompt] = useState('')
  const [files, setFiles] = useState<FileList | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const submit = async () => {
    setErr('')
    if (scenePrompt.trim().length < 3) return setErr('Опишите сцену')
    if (kind === 'i2v' && (!files || files.length !== 1)) {
      return setErr('Для оживления нужна ровно одна картинка сцены')
    }

    const form = new FormData()
    form.set('kind', kind)
    if (title) form.set('title', title)
    form.set('scenePrompt', scenePrompt)
    if (kind === 't2v' && motionPrompt) form.set('motionPrompt', motionPrompt)
    if (files) Array.from(files).forEach((f) => form.append('photos', f))

    setBusy(true)
    try {
      await api('/admin/reels', { method: 'POST', body: form, isForm: true })
      setTitle('')
      setScenePrompt('')
      setMotionPrompt('')
      setFiles(null)
      if (fileRef.current) fileRef.current.value = ''
      reload()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось запустить')
    } finally {
      setBusy(false)
    }
  }

  const activeCount = reels.filter((r) => ACTIVE.has(r.status)).length

  const onDelete = async (id: string) => {
    await api(`/admin/reels/${id}`, { method: 'DELETE' })
    reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Генерация роликов</h1>
        <p className="text-sm text-ink-3">Стиль Pixar и вертикаль 9:16 зашиты по умолчанию - опишите только сцену.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SamplePhoto
          slug="sample-child"
          label="Ребёнок по умолчанию"
          hint="Используется в «Рилс из фото», если не приложить своё фото"
          fallbackEmoji="🧒"
        />
        <SamplePhoto
          slug="sample-parents"
          label="Родители по умолчанию"
          hint="Используется в «Рилс из фото», если не приложить своё фото"
          fallbackEmoji="👨‍👩‍👧"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="h-fit">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setKind('t2v')}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${kind === 't2v' ? 'bg-accent text-white' : 'border border-line text-ink-2'}`}
            >
              Рилс из фото
            </button>
            <button
              onClick={() => setKind('i2v')}
              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${kind === 'i2v' ? 'bg-accent text-white' : 'border border-line text-ink-2'}`}
            >
              Оживить сцену
            </button>
          </div>

          <p className="mb-4 rounded-xl bg-surface-2 px-3 py-2 text-xs text-ink-3">
            {kind === 't2v'
              ? 'По умолчанию используется каст сверху. Приложите свои фото, только если нужны другие лица. Ролик длится 8 секунд - это один момент, а не история из нескольких сцен'
              : 'Загрузите готовую картинку сцены - оживим её через PixVerse'}
          </p>

          <div className="space-y-4">
            <Field label="Название (для себя)">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Малыш поперёк кровати" />
            </Field>
            <Field
              label={kind === 't2v' ? 'Описание сцены' : 'Что должно двигаться в сцене'}
              hint={
                kind === 't2v'
                  ? 'Это первый кадр: кто в кадре, где, как стоит, какой свет. Один момент, без «потом», «затем» и описания камеры - иначе модель нарисует раскадровку из нескольких панелей'
                  : undefined
              }
            >
              <Textarea
                rows={3}
                value={scenePrompt}
                onChange={(e) => setScenePrompt(e.target.value)}
                placeholder={
                  kind === 't2v'
                    ? 'toddler sleeping sideways between parents like a starfish, one foot on dad’s cheek'
                    : 'gentle breathing, hair moving softly in the wind, slow camera push-in'
                }
              />
            </Field>
            {kind === 't2v' && (
              <Field
                label="Что происходит за 8 секунд (необязательно)"
                hint="Движение героев и камеры: одно непрерывное действие, без склеек"
              >
                <Input value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)} placeholder="dad scoops the toddler up, slow push-in" />
              </Field>
            )}
            <Field label={kind === 't2v' ? 'Свои фото (необязательно)' : 'Картинка сцены'}>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple={kind === 't2v'}
                onChange={(e) => setFiles(e.target.files)}
                className="block w-full text-sm text-ink-2 file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-sm file:text-ink"
              />
            </Field>
            <ErrorText>{err}</ErrorText>
            <Button onClick={submit} loading={busy} className="w-full">
              Запустить генерацию
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">История генераций</h2>
            <span className="flex items-center gap-2 text-xs text-ink-3">
              {hasActive ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-leaf" />
                  {activeCount} в работе · обновляется…
                </>
              ) : (
                `${data?.total ?? reels.length} всего`
              )}
            </span>
          </div>

          {reels.length === 0 ? (
            <Card>
              <p className="text-ink-3">Роликов пока нет - запустите первую генерацию слева.</p>
            </Card>
          ) : (
            reels.map((r) => <ReelCard key={r.id} reel={r} onDelete={onDelete} />)
          )}
        </div>
      </div>
    </div>
  )
}
