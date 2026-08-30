import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FilmSlate } from '@phosphor-icons/react'
import { Card } from '@/shared/ui/Card'
import { cn } from '@/shared/lib/cn'
import { formatRub } from '@/shared/lib/format'
import { ROUTES, TOKEN_TO_RUB } from '@/shared/config/routes'
import { useSeo } from '@/shared/lib/seo'
import { fetchCatalog, type CatalogProduct } from '@/entities/catalog/model'

type Kind = 'book' | 'video'

const COPY: Record<Kind, { seo: 'books' | 'cartoons'; kicker: string; title: string; lead: string }> =
  {
    book: {
      seo: 'books',
      kicker: 'Книги',
      title: 'Сказки, где герой - ваш ребёнок',
      lead: 'Иллюстрированная книга в PDF. Каждая история про одно настоящее детское чувство: страх темноты, злость, расставание с мамой, первый раз у врача. Читается на телефоне прямо в вашей библиотеке.',
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
        <p className="mt-4 text-base leading-relaxed text-ink-800">{copy.lead}</p>
      </header>

      {error && <p className="text-sm text-berry">{error}</p>}

      {products === null && !error && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
  const Icon = isBook ? BookOpen : FilmSlate

  return (
    <Link to={to} className="group/tile block h-full">
      <Card interactive className="flex h-full flex-col overflow-hidden p-0">
        <div
          className={cn(
            'relative w-full overflow-hidden bg-night-900',
            isBook ? 'aspect-square' : 'aspect-video',
          )}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(242,179,61,0.22),transparent_65%)]"
          />
          {product.previewUrl && isBook && (
            <img
              src={product.previewUrl}
              alt={`Обложка книги «${product.title}»`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/tile:scale-[1.03]"
            />
          )}
          {!product.previewUrl && (
            <span className="absolute inset-0 grid place-items-center">
              <Icon className="h-9 w-9 text-moon-300" />
            </span>
          )}
          {isBook && (
            <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-xs font-semibold text-night-950">
              {product.sceneCount} стр
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <h2 className="font-display text-xl text-ink-900">{product.title}</h2>
          {product.tagline && (
            <p className="text-sm leading-relaxed text-ink-800">{product.tagline}</p>
          )}
          <p className="mt-auto pt-3 font-display text-lg text-mustard-deep">
            {formatRub(product.priceTokens * TOKEN_TO_RUB)}
          </p>
        </div>
      </Card>
    </Link>
  )
}
