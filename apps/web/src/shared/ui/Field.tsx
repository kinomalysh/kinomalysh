import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '@/shared/lib/cn'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function Field({ label, hint, error, className, id, ...rest }: FieldProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-semibold text-ink-800">
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          'h-12 w-full rounded-2xl border-2 bg-white px-4 text-base text-ink-900 placeholder:text-ink-500/50 transition-colors duration-150',
          error ? 'border-berry' : 'border-ink-900/20 focus:border-ink-900 hover:border-ink-900/40',
          className,
        )}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="text-xs font-medium text-berry">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
}
