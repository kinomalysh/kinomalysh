import type { HTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'paper rounded-3xl',
        interactive &&
          'cursor-pointer transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:shadow-paper-lg active:translate-y-0 active:scale-[0.99]',
        className,
      )}
      {...rest}
    />
  )
}
