import { useRef, useState } from 'react'
import { api, getAccess } from '@/shared/api'
import { useAsync } from '@/shared/useAsync'
import { Button, Card } from '@/shared/ui'

interface SamplePhotoResponse {
  hasSample: boolean
  url: string | null
}

interface SamplePhotoProps {
  slug: string
  label: string
  hint: string
  fallbackEmoji: string
}

export function SamplePhoto({ slug, label, hint, fallbackEmoji }: SamplePhotoProps) {
  const { data, reload } = useAsync(() => api<SamplePhotoResponse>(`/admin/settings/${slug}`), [slug])
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  const upload = async (file: File) => {
    setBusy(true)
    const form = new FormData()
    form.set('photo', file)
    try {
      await fetch(`/api/admin/settings/${slug}`, {
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
        <img src={data.url} alt={label} className="h-16 w-16 rounded-xl object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-2 text-2xl">
          {fallbackEmoji}
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-ink-3">{hint}</p>
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
