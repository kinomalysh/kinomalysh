import { useEffect, useRef, useState } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { cn } from '@/shared/lib/cn'

const SPARK_COUNT = 12
const BURST_MS = 950
const AUTO_PLAY_DELAY_MS = 1400

interface Spark {
  id: number
  dx: string
  dy: string
  size: number
  delay: string
}

const SPARKS: Spark[] = Array.from({ length: SPARK_COUNT }, (_, id) => {
  const angle = (id / SPARK_COUNT) * Math.PI * 2
  const dist = 38 + (id % 3) * 16
  return {
    id,
    dx: `${Math.cos(angle) * dist}cqw`,
    dy: `${Math.sin(angle) * dist}cqw`,
    size: 12 + (id % 4) * 5,
    delay: `${(id % 5) * 45}ms`,
  }
})

interface MagicCardProps {
  photoSrc: string
  heroSrc: string
}

export function MagicCard({ photoSrc, heroSrc }: MagicCardProps) {
  const [showHero, setShowHero] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const [bursting, setBursting] = useState(false)
  const played = useRef(false)

  const toggle = () => {
    setShowHero((v) => !v)
    setBurstKey((k) => k + 1)
    setBursting(true)
    window.setTimeout(() => setBursting(false), BURST_MS)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!played.current) {
        played.current = true
        toggle()
      }
    }, AUTO_PLAY_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <button
      type="button"
      onClick={() => {
        played.current = true
        toggle()
      }}
      aria-pressed={showHero}
      aria-label={showHero ? 'Показать исходное фото' : 'Превратить фото в героя'}
      className="group relative block w-full cursor-pointer overflow-hidden rounded-[1.6rem] [container-type:inline-size]"
    >
      <img
        src={photoSrc}
        alt="Обычное фото девочки"
        width={560}
        height={560}
        draggable={false}
        className="block aspect-square w-full select-none object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          clipPath: showHero ? 'circle(120% at 50% 55%)' : 'circle(0% at 50% 55%)',
          transition: 'clip-path 850ms cubic-bezier(0.65, 0, 0.3, 1)',
        }}
      >
        <img
          src={heroSrc}
          alt=""
          width={560}
          height={560}
          draggable={false}
          className="block aspect-square w-full select-none object-cover"
        />
      </div>

      {bursting && (
        <span key={`glow-${burstKey}`} aria-hidden className="pointer-events-none absolute inset-0">
          <span
            className="absolute inset-0 animate-burst"
            style={{
              background:
                'radial-gradient(circle at 50% 55%, rgba(255,217,138,0.85) 0%, rgba(255,196,107,0.35) 38%, transparent 70%)',
            }}
          />
          {SPARKS.map((s) => (
            <Sparkle
              key={s.id}
              weight="fill"
              className="absolute left-1/2 top-[55%] animate-spark text-moon-300 drop-shadow-[0_0_6px_rgba(255,217,138,0.9)]"
              style={{
                width: s.size,
                height: s.size,
                '--dx': s.dx,
                '--dy': s.dy,
                animationDelay: s.delay,
              } as React.CSSProperties}
            />
          ))}
        </span>
      )}

      <span
        className={cn(
          'absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-opacity duration-300',
          showHero ? 'opacity-0' : 'bg-night-950/70 text-cream',
        )}
      >
        фото
      </span>
      <span
        className={cn(
          'absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-opacity duration-300',
          showHero ? 'bg-night-950/70 text-cream' : 'opacity-0',
        )}
      >
        герой
      </span>

      <span className="absolute inset-x-0 bottom-3 flex justify-center">
        <span className="flex items-center gap-1.5 rounded-full border-2 border-night-950 bg-cream px-3.5 py-1.5 text-xs font-bold text-night-950 shadow-[2px_3px_0_rgba(0,0,0,0.35)] transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0">
          <Sparkle weight="fill" className="h-3.5 w-3.5 text-mustard-deep" />
          {showHero ? 'нажмите — вернуть фото' : 'нажмите для магии'}
        </span>
      </span>
    </button>
  )
}
