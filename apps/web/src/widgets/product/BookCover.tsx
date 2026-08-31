import { cn } from '@/shared/lib/cn'

interface BookCoverProps {
  title: string
  imageUrl: string | null
  pages?: number
  className?: string
  size?: 'tile' | 'hero'
}

// Обложка построена по канону детской книги и киноплаката: один фокус - лицо
// героя, заголовок в верхней трети, крупный и контрастный, чтобы читаться в
// размере ногтя. Иллюстрация под обложку рисуется отдельным промптом с чистым
// верхом, поэтому текст ложится на живой фон, а не на пустую полосу.
export function BookCover({ title, imageUrl, pages, className, size = 'tile' }: BookCoverProps) {
  const isHero = size === 'hero'

  return (
    <div
      className={cn(
        'relative aspect-[3/4] w-full overflow-hidden rounded-l-[6px] rounded-r-2xl bg-night-900',
        'shadow-[0_18px_40px_-18px_rgba(12,10,30,0.8)]',
        className,
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          aria-hidden
          loading={isHero ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(242,179,61,0.3),transparent_70%)]" />
      )}

      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[46%] bg-gradient-to-b from-night-950 via-night-950/75 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night-950/85 to-transparent"
      />

      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/50 via-black/18 to-transparent"
      />
      <div aria-hidden className="absolute inset-y-0 left-[7%] w-px bg-white/12" />

      <div className={cn('absolute inset-x-0 top-0', isHero ? 'p-6 pl-9' : 'p-3.5 pl-5')}>
        <p
          className={cn(
            'font-display uppercase tracking-[0.24em] text-mustard',
            isHero ? 'text-xs' : 'text-[8px]',
          )}
        >
          Киномалыш
        </p>
        <h3
          className={cn(
            'mt-1.5 text-balance font-display uppercase leading-[1.02] tracking-[-0.01em] text-cream',
            'drop-shadow-[0_2px_10px_rgba(6,4,20,0.9)]',
            isHero ? 'text-[2.6rem]' : 'text-[17px] sm:text-[19px]',
          )}
        >
          {title}
        </h3>
        <span
          aria-hidden
          className={cn('mt-2 block rounded-full bg-mustard', isHero ? 'h-1 w-16' : 'h-[3px] w-8')}
        />
      </div>

      {pages ? (
        <p
          className={cn(
            'absolute inset-x-0 bottom-0 text-center font-display uppercase tracking-[0.2em] text-cream/70',
            isHero ? 'p-5 text-[11px]' : 'p-3 text-[8px]',
          )}
        >
          Сказка · {pages} страниц
        </p>
      ) : null}
    </div>
  )
}
