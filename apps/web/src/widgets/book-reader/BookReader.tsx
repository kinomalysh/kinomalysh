import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { cn } from '@/shared/lib/cn'
import { prefersReducedMotion, projectMomentum, rubberband, Spring } from '@/shared/lib/spring'

export interface BookReaderPage {
  imageUrl: string
  text?: string
}

interface BookReaderProps {
  title: string
  pages: BookReaderPage[]
  className?: string
}

const DRAG_THRESHOLD = 10
const VELOCITY_SAMPLES = 5

interface Sample {
  x: number
  t: number
}

export function BookReader({ title, pages, className }: BookReaderProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const springRef = useRef<Spring | null>(null)
  const widthRef = useRef(0)
  const indexRef = useRef(0)
  const samplesRef = useRef<Sample[]>([])
  const dragRef = useRef<{ startX: number; startOffset: number; active: boolean } | null>(null)

  const [index, setIndex] = useState(0)
  const [width, setWidth] = useState(0)

  const applyOffset = useCallback((offset: number) => {
    const track = trackRef.current
    if (track) track.style.transform = `translate3d(${-offset}px, 0, 0)`
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(() => {
      const next = viewport.clientWidth
      widthRef.current = next
      setWidth(next)
      springRef.current?.set(indexRef.current * next)
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    springRef.current = new Spring(0, applyOffset, { damping: 1, response: 0.4 })
    return () => springRef.current?.stop()
  }, [applyOffset])

  const goTo = useCallback(
    (next: number, velocity = 0) => {
      const clamped = Math.max(0, Math.min(pages.length - 1, next))
      indexRef.current = clamped
      setIndex(clamped)
      const spring = springRef.current
      if (!spring) return
      const target = clamped * widthRef.current
      if (prefersReducedMotion()) {
        spring.set(target)
        return
      }
      // Отскок только когда движение задал сам пользователь броском.
      const flicked = Math.abs(velocity) > 200
      spring.animateTo(target, {
        velocity,
        damping: flicked ? 0.8 : 1,
        response: flicked ? 0.35 : 0.4,
      })
    },
    [pages.length],
  )

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    const spring = springRef.current
    if (!spring) return
    // Перехват на лету: берём текущее экранное значение, а не целевое.
    const live = spring.current
    spring.stop()
    dragRef.current = { startX: event.clientX, startOffset: live, active: false }
    samplesRef.current = [{ x: event.clientX, t: performance.now() }]
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current
    const spring = springRef.current
    if (!drag || !spring) return

    const dx = event.clientX - drag.startX
    if (!drag.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return
      drag.active = true
    }

    const samples = samplesRef.current
    samples.push({ x: event.clientX, t: performance.now() })
    if (samples.length > VELOCITY_SAMPLES) samples.shift()

    const maxOffset = (pages.length - 1) * widthRef.current
    let offset = drag.startOffset - dx
    // Мягкие границы: за краем сопротивление растёт, а не стена.
    if (offset < 0) offset = -rubberband(-offset, widthRef.current)
    else if (offset > maxOffset) offset = maxOffset + rubberband(offset - maxOffset, widthRef.current)
    spring.set(offset)
  }, [pages.length])

  const endDrag = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current
      const spring = springRef.current
      dragRef.current = null
      if (!drag || !spring) return
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
      if (!drag.active) return

      const samples = samplesRef.current
      const first = samples[0]
      const last = samples[samples.length - 1]
      const elapsed = last && first ? last.t - first.t : 0
      const velocity = elapsed > 0 ? ((last.x - first.x) / elapsed) * -1000 : 0

      // Куда бросок доедет сам, туда и листаем - не к ближайшему краю от точки отпускания.
      const projected = spring.current + projectMomentum(velocity)
      const target = Math.round(projected / Math.max(widthRef.current, 1))
      goTo(target, velocity)
    },
    [goTo],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') goTo(indexRef.current + 1)
      if (event.key === 'ArrowLeft') goTo(indexRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo])

  if (pages.length === 0) return null

  return (
    <section className={cn('select-none', className)} aria-roledescription="книга" aria-label={title}>
      <div
        ref={viewportRef}
        className="relative aspect-square w-full overflow-hidden rounded-3xl bg-ink-900/5 touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div ref={trackRef} className="flex h-full will-change-transform">
          {pages.map((page, i) => (
            <figure
              key={i}
              className="relative h-full shrink-0"
              style={{ width: width || '100%' }}
              aria-label={`Страница ${i + 1} из ${pages.length}`}
            >
              <img
                src={page.imageUrl}
                alt={page.text ?? `Страница ${i + 1}`}
                draggable={false}
                width={900}
                height={900}
                decoding="async"
                loading={i <= 1 ? 'eager' : 'lazy'}
                className="h-full w-full object-cover"
              />
            </figure>
          ))}
        </div>

        <PageNav
          direction="prev"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        />
        <PageNav
          direction="next"
          disabled={index === pages.length - 1}
          onClick={() => goTo(index + 1)}
        />
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden>
        {pages.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === index ? 'w-5 bg-ink-900' : 'w-1.5 bg-ink-900/25',
            )}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-sm text-ink-800">
        Страница {index + 1} из {pages.length}
      </p>
    </section>
  )
}

function PageNav({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  const Icon = direction === 'prev' ? CaretLeft : CaretRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Предыдущая страница' : 'Следующая страница'}
      className={cn(
        'absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full',
        'bg-white/60 text-ink-900 backdrop-blur-xl',
        'transition-[transform,opacity] duration-150 active:scale-95',
        'disabled:pointer-events-none disabled:opacity-0',
        direction === 'prev' ? 'left-3' : 'right-3',
      )}
    >
      <Icon className="h-5 w-5" weight="bold" />
    </button>
  )
}
