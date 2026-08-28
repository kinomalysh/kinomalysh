import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-poppy text-on-poppy border-2 border-ink-900 shadow-[3px_4px_0_rgba(35,42,69,0.9)] hover:bg-poppy-deep active:translate-y-0.5 active:shadow-[2px_2px_0_rgba(35,42,69,0.9)] font-semibold',
  secondary:
    'bg-white border-2 border-ink-900 text-ink-900 shadow-[3px_4px_0_rgba(35,42,69,0.35)] hover:bg-paper-shade active:translate-y-0.5 active:shadow-[2px_2px_0_rgba(35,42,69,0.35)] font-semibold',
  ghost: 'text-ink-800 hover:bg-ink-900/5 font-medium',
  danger: 'bg-white text-berry border-2 border-berry/60 hover:bg-berry/5 font-semibold',
}

const sizes: Record<Size, string> = {
  sm: 'h-11 px-4 text-sm rounded-xl',
  md: 'h-12 px-6 text-base rounded-2xl',
  lg: 'h-14 px-8 text-base rounded-2xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 cursor-pointer select-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  )
}
