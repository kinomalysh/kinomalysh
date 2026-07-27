import { useEffect, useRef, useState } from 'react'
import { api } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Badge, Button, Card, ErrorText, Field, Input, Textarea } from '@/shared/ui'

type ReelKind = 't2v' | 'i2v'

interface Reel {
  id: string
  kind: ReelKind
  title: string | null
  scenePrompt: string
  status: string
  firstFrameUrl: string | null
  resultUrl: string | null
  failReason: string | null
  createdAt: string
}

interface ReelsResponse {
  reels: Reel[]
  total: number
}

const ACTIVE = new Set(['queued', 'framing', 'animating'])

export function ReelsPage() {
  const { data, reload } = useAsync(() => api<ReelsResponse>('/admin/reels?page=1'), [])
  const reels = data?.reels ?? []

  const hasActive = reels.some((r) => ACTIVE.has(r.status))
  const reloadRef = useRef(reload)
  reloadRef.current = reload
  useEffect(() => {
    if (!hasActive) return
    const t = setInterval(() => reloadRef.current(), 6000)
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
    if (!files || files.length === 0) return setErr('Приложите фото')
    if (kind === 'i2v' && files.length !== 1) return setErr('Для оживления нужна ровно одна картинка сцены')

    const form = new FormData()
    form.set('kind', kind)
    if (title) form.set('title', title)
    form.set('scenePrompt', scenePrompt)
    if (kind === 't2v' && motionPrompt) form.set('motionPrompt', motionPrompt)
    Array.from(files).forEach((f) => form.append('photos', f))

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Генерация роликов</h1>
        <p className="text-sm text-ink-3">Стиль Pixar и вертикаль 9:16 зашиты по умолчанию — опишите только сцену.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
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
              ? 'Загрузите фото ребёнка (и родителей) — сделаем Pixar-кадр и оживим его.'
              : 'Загрузите готовую картинку сцены — оживим её через PixVerse.'}
          </p>

          <div className="space-y-4">
            <Field label="Название (для себя)">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Малыш поперёк кровати" />
            </Field>
            <Field label={kind === 't2v' ? 'Описание сцены' : 'Что должно двигаться в сцене'}>
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
              <Field label="Движение камеры (необязательно)">
                <Input value={motionPrompt} onChange={(e) => setMotionPrompt(e.target.value)} placeholder="slow push-in, soft parallax" />
              </Field>
            )}
            <Field label={kind === 't2v' ? 'Фото ребёнка / родителей' : 'Картинка сцены'}>
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
          {reels.length === 0 && <p className="text-ink-3">Роликов пока нет</p>}
          {reels.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{r.title ?? 'Без названия'}</p>
                  <p className="mt-0.5 truncate text-sm text-ink-3">{r.scenePrompt}</p>
                  <p className="mt-1 text-xs text-ink-3">{r.kind === 't2v' ? 'Рилс из фото' : 'Оживление сцены'}</p>
                </div>
                <Badge value={r.status} />
              </div>
              {r.failReason && <p className="mt-2 text-sm text-berry">{r.failReason}</p>}
              {(r.resultUrl || r.firstFrameUrl) && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {r.firstFrameUrl && !r.resultUrl && (
                    <img src={r.firstFrameUrl} alt="Кадр" className="h-40 rounded-lg" />
                  )}
                  {r.resultUrl && <video src={r.resultUrl} controls className="h-64 rounded-lg" />}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
