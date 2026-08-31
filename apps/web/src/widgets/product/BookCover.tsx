import { cn } from '@/shared/lib/cn'

interface BookCoverProps {
  title: string
  imageUrl: string | null
  pages?: number
  className?: string
  size?: 'tile' | 'hero'
}

// Обложка книги, а не просто картинка страницы. Название лежит на самой обложке,
// слева корешок с фальцем - так объект читается как книга, а не как случайный кадр.
export function BookCover({ title, imageUrl, pages, className, size = 'tile' }: BookCoverProps) {
  const isHero = size === 'hero'

  return (
    <div
      className={cn(
        'relative aspect-[3/4] w-full overflow-hidden rounded-l-[6px] rounded-r-2xl bg-night-900',
        'shadow-[0_18px_40px_-18px_rgba(12,10,30,0.75)]',
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(242,179,61,0.28),transparent_70%)]" />
      )}

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-night-950 via-night-950/80 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-night-950/70 to-transparent"
      />

      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/45 via-black/15 to-transparent"
      />
      <div aria-hidden className="absolute inset-y-0 left-[7%] w-px bg-white/12" />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <span
          className={cn(
            'font-display uppercase tracking-[0.22em] text-cream/70',
            isHero ? 'pl-3 text-[11px]' : 'pl-2.5 text-[9px]',
          )}
        >
          Киномалыш
        </span>
        {pages ? (
          <span
            className={cn(
              'rounded-full bg-cream/95 font-semibold text-night-950',
              isHero ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]',
            )}
          >
            {pages} стр
          </span>
        ) : null}
      </div>

      <div className={cn('absolute inset-x-0 bottom-0', isHero ? 'p-6 pl-8' : 'p-4 pl-5')}>
        <span
          aria-hidden
          className={cn('mb-3 block rounded-full bg-mustard', isHero ? 'h-1 w-14' : 'h-0.5 w-9')}
        />
        <h3
          className={cn(
            'text-balance font-display leading-[1.08] tracking-[-0.02em] text-cream',
            isHero ? 'text-3xl lg:text-4xl' : 'text-lg',
          )}
        >
          {title}
        </h3>
      </div>
    </div>
  )
}
