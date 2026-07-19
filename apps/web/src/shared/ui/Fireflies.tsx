import { useMemo } from 'react'

const COUNT = 9

export function Fireflies() {
  const flies = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, id) => ({
        id,
        left: `${6 + Math.random() * 88}%`,
        bottom: `${-4 + Math.random() * 30}%`,
        size: 3 + Math.random() * 3,
        delay: `${Math.random() * 14}s`,
        duration: `${10 + Math.random() * 9}s`,
      })),
    [],
  )

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {flies.map((f) => (
        <span
          key={f.id}
          className="absolute rounded-full animate-drift-up"
          style={{
            left: f.left,
            bottom: f.bottom,
            width: f.size,
            height: f.size,
            background: 'var(--t-particle)',
            boxShadow: '0 0 10px var(--t-particle)',
            animationDelay: f.delay,
            animationDuration: f.duration,
          }}
        />
      ))}
    </div>
  )
}
