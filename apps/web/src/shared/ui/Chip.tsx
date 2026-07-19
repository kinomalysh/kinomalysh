import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active = false, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-semibold cursor-pointer transition-all duration-150 border-2',
        active
          ? 'bg-solid border-solid text-on-solid shadow-[2px_3px_0_rgba(35,42,69,0.3)]'
          : 'border-ink-900/20 bg-white text-ink-800 hover:border-ink-900/50',
        className,
      )}
      aria-pressed={active}
      {...rest}
    />
  )
}
