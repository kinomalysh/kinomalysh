import { useEffect, useState } from 'react'
import { Play, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { fetchCatalog, type CatalogProduct } from '@/entities/catalog/model'
import { useWizard } from '@/features/wizard/model'
import { BookCover } from '@/widgets/product/BookCover'

export function StepProduct() {
  const chooseProduct = useWizard((s) => s.chooseProduct)
  const [products, setProducts] = useState<CatalogProduct[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    fetchCatalog()
      .then((list) => {
        if (alive) setProducts(list)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900 lg:text-3xl">Что делаем?</h1>
        <p className="text-pretty text-sm text-ink-800">
          История уже написана. Ваш ребёнок станет её главным героем - портрет утвердите бесплатно,
          до оплаты
        </p>
      </header>

      {failed && (
        <Card className="flex items-start gap-3 p-5">
          <WarningCircle className="mt-0.5 h-5 w-5 shrink-0 text-berry" />
          <div>
            <p className="text-sm font-semibold text-ink-900">Каталог не загрузился</p>
            <p className="mt-1 text-sm text-ink-800">
              Обновите страницу - если не поможет, напишите нам в Telegram
            </p>
          </div>
        </Card>
      )}

      {!failed && products === null && (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <li key={key} className="aspect-[3/4] animate-pulse rounded-2xl bg-paper-shade" />
          ))}
        </ul>
      )}

      {products !== null && products.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-display text-lg text-ink-900">Скоро здесь появятся сказки</p>
          <p className="mt-2 text-sm text-ink-800">
            Мы дорисовываем первые истории. Напишите в Telegram - сообщим, как только всё будет
            готово
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-5"
            onClick={() => window.open('https://t.me/kinomalysh_help', '_blank', 'noopener')}
          >
            Написать в Telegram
          </Button>
        </Card>
      )}

      {products !== null && products.length > 0 && (
        <div className="space-y-9">
          {(['book', 'video'] as const).map((kind) => {
            const group = products.filter((p) => p.kind === kind)
            if (group.length === 0) return null
            return (
              <section key={kind} className="space-y-4">
                <div className="flex items-baseline justify-between gap-3 border-b-2 border-dashed border-ink-900/12 pb-2">
                  <h2 className="font-display text-xl text-ink-900">
                    {kind === 'book' ? 'Книги-сказки' : 'Мультфильмы'}
                  </h2>
                  <p className="shrink-0 text-sm text-ink-800">
                    {kind === 'book' ? '250 ₽ · 8 страниц' : '1 990 ₽ · 2 минуты'}
                  </p>
                </div>
                <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {group.map((product) => (
                    <li key={product.id}>
                      <ProductChoice product={product} onChoose={() => chooseProduct(product)} />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProductChoice({
  product,
  onChoose,
}: {
  product: CatalogProduct
  onChoose: () => void
}) {
  const isBook = product.kind === 'book'
  return (
    <button
      type="button"
      onClick={onChoose}
      aria-label={`Выбрать «${product.title}»`}
      className="group/pick block w-full text-left focus-visible:outline-none"
    >
      <div className="transition-transform duration-300 ease-out group-hover/pick:-translate-y-1.5 group-focus-visible/pick:-translate-y-1.5">
        {isBook ? (
          <BookCover title={product.title} imageUrl={product.previewUrl} pages={product.sceneCount} />
        ) : (
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-night-900 shadow-[0_18px_40px_-18px_rgba(12,10,30,0.75)]">
            {product.previewUrl && (
              <video
                src={`${product.previewUrl}#t=1`}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-night-950 via-night-950/80 to-transparent"
            />
            <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-cream/90 text-night-950">
              <Play weight="fill" className="ml-0.5 h-4 w-4" />
            </span>
            <span className="absolute bottom-4 left-4 right-4">
              <span aria-hidden className="mb-3 block h-0.5 w-9 rounded-full bg-mustard" />
              <span className="block text-balance font-display text-lg leading-[1.08] text-cream">
                {product.title}
              </span>
            </span>
          </div>
        )}
      </div>
    </button>
  )
}
