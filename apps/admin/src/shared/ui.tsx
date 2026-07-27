import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'ghost' | 'danger'
  loading?: boolean
}

export function Button({ variant = 'solid', loading, className, children, disabled, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = {
    solid: 'bg-accent text-white hover:bg-accent-press',
    ghost: 'border border-line-strong text-ink hover:bg-surface-2',
    danger: 'border border-berry/50 text-berry hover:bg-berry/10',
  }[variant]
  return (
    <button className={cn(base, styles, className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner />}
      {children}
    </button>
  )
}

export function Spinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-5 shadow-lg shadow-black/20', className)}>
      {children}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</span>
      {children}
    </label>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-line-strong',
        className,
      )}
      {...rest}
    />
  )
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-3 focus:border-line-strong',
        className,
      )}
      {...rest}
    />
  )
}

const BADGE_TONES: Record<string, string> = {
  ready: 'bg-leaf/15 text-leaf',
  rendering: 'bg-gold/15 text-gold',
  animating: 'bg-gold/15 text-gold',
  framing: 'bg-gold/15 text-gold',
  casting: 'bg-gold/15 text-gold',
  queued: 'bg-ink-3/15 text-ink-2',
  awaiting_choice: 'bg-ink-3/15 text-ink-2',
  awaiting_details: 'bg-ink-3/15 text-ink-2',
  failed: 'bg-berry/15 text-berry',
}

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        BADGE_TONES[value] ?? 'bg-ink-3/15 text-ink-2',
      )}
    >
      {STATUS_LABELS[value] ?? value}
    </span>
  )
}

export const STATUS_LABELS: Record<string, string> = {
  casting: 'Кастинг',
  awaiting_choice: 'Выбор героя',
  awaiting_details: 'Детали',
  rendering: 'Рендер',
  ready: 'Готово',
  failed: 'Ошибка',
  queued: 'В очереди',
  framing: 'Кадр',
  animating: 'Оживление',
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p className="text-sm text-berry">{children}</p>
}
