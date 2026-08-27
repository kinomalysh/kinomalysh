interface ProgressProps {
  value: number
  label?: string
}

export function Progress({ value, label }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="relative h-2 w-full overflow-hidden rounded-full bg-paper-shade"
    >
      <div
        className="absolute inset-0 rounded-full bg-poppy transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `translate3d(${clamped - 100}%, 0, 0)` }}
      />
    </div>
  )
}
