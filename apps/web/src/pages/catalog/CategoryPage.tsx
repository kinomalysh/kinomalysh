import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play } from '@phosphor-icons/react'
import { Card } from '@/shared/ui/Card'
import { BookCover } from '@/widgets/product/BookCover'
import { ROUTES } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { fetchCatalog, type CatalogProduct } from '@/entities/catalog/model'

type Kind = 'book' | 'video'

const COPY: Record<Kind, { seo: 'books' | 'cartoons'; kicker: string; title: string; lead: string }> =
  {
    book: {
      seo: 'books',
      kicker: 'Книги',
      title: 'Сказки, где герой - ваш ребёнок',
      lead: 'Каждая книга - восемь разворотов, где ваш ребёнок нарисован главным героем. Каждая история про одно настоящее детское чувство: страх темноты, злость, расставание с мамой, первый раз у врача. Читается на телефоне прямо в вашей библиотеке.',
    },
    video: {
      seo: 'cartoons',
      kicker: 'Мультфильмы',
      title: 'Мультфильм, где играет ваш ребёнок',
      lead: 'Две минуты анимации с озвучкой, где главную роль исполняет ваш ребёнок. Одно фото, готово примерно за пятнадцать минут.',
    },
  }

export function CategoryPage({ kind }: { kind: Kind }) {
  const copy = COPY[kind]
  const price = kind === 'book' ? '250 ₽' : '1 990 ₽'
  useSeo(copy.seo)
  const [products, setProducts] = useState<CatalogProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCatalog()
      .then((all) => setProducts(all.filter((p) => p.kind === kind)))
      .catch(() => setError('Каталог не загрузился'))
  }, [kind])

  return (
    <div className="shell space-y-8 pt-4 animate-rise lg:pt-10">
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-poppy">
          {copy.kicker}
        </p>
        <h1 className="mt-2 font-display text-3xl leading-[1.05] tracking-[-0.02em] text-ink-900 lg:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-ink-800">{copy.lead}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
          <p className="font-display text-2xl text-mustard-deep">
            {price}
            <span className="ml-2 align-middle text-sm font-normal text-ink-800">
              за любую {kind === 'book' ? 'книгу' : 'историю'}
            </span>
          </p>
          <p className="text-sm text-ink-800">Портрет героя бесплатно, до оплаты</p>
        </div>
      </header>

      {error && <p className="text-sm text-berry">{error}</p>}

      {products === null && !error && (
        <ul className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2].map((k) => (
            <li key={k} className="h-64 animate-pulse rounded-3xl bg-paper-shade" />
          ))}
        </ul>
      )}

      {products?.length === 0 && (
        <Card className="p-10 text-center">
          <p className="font-display text-lg text-ink-900">Здесь пока пусто</p>
          <p className="mt-2 text-sm text-ink-800">Скоро появятся новые сюжеты</p>
        </Card>
      )}

      {products && products.length > 0 && (
        <ul className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductTile product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductTile({ product }: { product: CatalogProduct }) {
  const isBook = product.kind === 'book'
  const to = isBook ? ROUTES.book(product.slug) : ROUTES.cartoon(product.slug)

  return (
    <Link to={to} className="group/tile block h-full focus-visible:outline-none">
      <article className="flex h-full flex-col">
        <div className="transition-transform duration-300 ease-out group-hover/tile:-translate-y-1.5 group-focus-visible/tile:-translate-y-1.5">
          {isBook ? (
            <BookCover title={product.title} imageUrl={product.previewUrl} pages={product.sceneCount} />
          ) : (
            <VideoPoster product={product} />
          )}
        </div>

        {product.tagline && (
          <p className="mt-3 text-pretty text-sm leading-snug text-ink-800">{product.tagline}</p>
        )}
      </article>
    </Link>
  )
}

// У ролика не было превью вообще - пустая карточка с кнопкой. Кадр по времени
// заставляет браузер отрисовать первый кадр вместо чёрного прямоугольника.
function VideoPoster({ product }: { product: CatalogProduct }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-night-900 shadow-[0_18px_40px_-18px_rgba(12,10,30,0.75)]">
      {product.previewUrl ? (
        <video
          src={`${product.previewUrl}#t=1`}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
          onMouseEnter={(e) => void e.currentTarget.play().catch(() => undefined)}
          onMouseLeave={(e) => {
            e.currentTarget.pause()
            e.currentTarget.currentTime = 1
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,106,84,0.28),transparent_70%)]" />
      )}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-night-950 via-night-950/80 to-transparent"
      />
      <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-0.5 text-[10px] font-semibold text-night-950">
        Мультфильм
      </span>
      <span className="absolute bottom-4 left-4 right-4">
        <span aria-hidden className="mb-3 block h-0.5 w-9 rounded-full bg-mustard" />
        <span className="block text-balance font-display text-lg leading-[1.08] text-cream">
          {product.title}
        </span>
      </span>
      <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-cream/90 text-night-950 transition-transform duration-200 group-hover/tile:scale-110">
        <Play weight="fill" className="ml-0.5 h-4 w-4" />
      </span>
    </div>
  )
}
