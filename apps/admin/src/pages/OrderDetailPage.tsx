import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/shared/api'
import { LazyVideo } from '@/shared/LazyVideo'
import { useAsync } from '@/shared/useAsync'
import { Badge, Button, Card, ErrorText, Spinner, Textarea } from '@/shared/ui'

interface OrderDetail {
  id: string
  status: string
  plotId: string | null
  childName: string | null
  childAge: number | null
  gender: string | null
  format: string | null
  tokensCost: number | null
  avatars: string[]
  chosenAvatar: number | null
  scenePrompts: string[]
  promptsFromPlot: boolean
  scenes: string[]
  resultUrl: string | null
  failReason: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string; name: string } | null
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, reload } = useAsync(
    () => api<{ story: OrderDetail }>(`/admin/stories/${id}`),
    [id],
  )
  const story = data?.story

  const [prompts, setPrompts] = useState<string[]>([])
  const [saveMsg, setSaveMsg] = useState('')
  const [saveErr, setSaveErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (story) setPrompts(story.scenePrompts)
  }, [story])

  if (loading) return <Spinner />
  if (!story) return <p className="text-berry">{error ?? 'Заказ не найден'}</p>

  const savePrompts = async () => {
    setSaving(true)
    setSaveErr('')
    setSaveMsg('')
    try {
      await api(`/admin/stories/${story.id}/prompts`, {
        method: 'PATCH',
        body: { scenePrompts: prompts.map((p) => p.trim()).filter(Boolean) },
      })
      setSaveMsg('Промпты сохранены в БД')
      reload()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const regenerate = async () => {
    if (!confirm('Перезапустить рендер заказа с текущими промптами?')) return
    setRegenerating(true)
    setSaveErr('')
    try {
      await api(`/admin/stories/${story.id}/regenerate`, { method: 'POST' })
      reload()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Не удалось перезапустить')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="text-sm text-ink-3 hover:text-ink">
          ← Заказы
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{story.childName ?? 'Без имени'}</h1>
          <p className="text-sm text-ink-3">
            {story.user?.email} · сюжет {story.plotId ?? '-'} · {story.format ?? '-'}
          </p>
        </div>
        <Badge value={story.status} />
      </div>

      {story.failReason && (
        <Card className="border-berry/40">
          <p className="text-sm text-berry">Ошибка: {story.failReason}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Герой</h2>
          {story.avatars.length === 0 ? (
            <p className="text-ink-3">Аватары ещё не сгенерированы</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {story.avatars.map((url, i) => (
                <img
                  key={url}
                  src={url}
                  alt={`Аватар ${i + 1}`}
                  className={`h-28 w-28 rounded-xl object-cover ${story.chosenAvatar === i ? 'ring-2 ring-gold' : 'opacity-70'}`}
                />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Результат</h2>
          {story.resultUrl ? (
            isVideo(story.resultUrl) ? (
              <LazyVideo src={story.resultUrl} className="aspect-video w-full rounded-xl" />
            ) : (
              <img src={story.resultUrl} alt="Результат" className="w-full rounded-xl" />
            )
          ) : (
            <p className="text-ink-3">Ещё не готов</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Промпты сцен</h2>
            <p className="text-xs text-ink-3">
              {story.promptsFromPlot
                ? 'Значения по умолчанию из сюжета - сохраните, чтобы зафиксировать в БД'
                : 'Отредактировано и сохранено в БД'}
            </p>
          </div>
          <Button variant="ghost" onClick={() => setPrompts((p) => [...p, ''])}>
            + Сцена
          </Button>
        </div>

        <div className="space-y-3">
          {prompts.map((prompt, i) => (
            <div key={i} className="flex gap-2">
              <span className="mt-2.5 w-6 shrink-0 text-sm text-ink-3">{i + 1}.</span>
              <Textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompts((p) => p.map((v, j) => (j === i ? e.target.value : v)))}
              />
              <button
                onClick={() => setPrompts((p) => p.filter((_, j) => j !== i))}
                className="mt-1 h-8 w-8 shrink-0 rounded-lg text-ink-3 hover:bg-berry/10 hover:text-berry"
                title="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button onClick={savePrompts} loading={saving}>
            Сохранить промпты
          </Button>
          <Button variant="ghost" onClick={regenerate} loading={regenerating}>
            Перегенерировать заказ
          </Button>
          {saveMsg && <span className="text-sm text-leaf">{saveMsg}</span>}
          <ErrorText>{saveErr}</ErrorText>
        </div>
      </Card>

      {story.scenes.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold">Кадры / клипы сцен</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {story.scenes.map((url, i) =>
              isVideo(url) ? (
                <LazyVideo key={i} src={url} className="aspect-video w-full rounded-lg" />
              ) : (
                <img key={i} src={url} alt={`Сцена ${i + 1}`} className="w-full rounded-lg" />
              ),
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
