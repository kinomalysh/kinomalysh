import { useState } from 'react'
import { cn } from '@/shared/ui'

interface LazyVideoProps {
  src: string
  poster?: string | null
  className?: string
}

export function LazyVideo({ src, poster, className }: LazyVideoProps) {
  const [revealed, setRevealed] = useState(false)

  if (revealed) {
    return <video src={src} controls autoPlay className={className} />
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className={cn(
        'group relative flex items-center justify-center overflow-hidden rounded-lg bg-surface-2',
        className,
      )}
    >
      {poster ? (
        <img src={poster} alt="Превью" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="text-3xl">🎬</span>
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
        <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink">▶ Смотреть</span>
      </span>
    </button>
  )
}
