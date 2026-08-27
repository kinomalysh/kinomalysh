import { useEffect, useState } from 'react'
import { FilmSlate, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { TOKEN_TO_RUB } from '@/shared/config/routes'
import { formatRub } from '@/shared/lib/format'
import { fetchCatalog, type CatalogProduct } from '@/entities/catalog/model'
import { useWizard } from '@/features/wizard/model'

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
        <h1 className="font-display text-2xl text-ink-900">Какой мультфильм снимаем?</h1>
        <p className="text-sm text-ink-800">
          История уже написана и озвучена. Ваш ребёнок станет её главным героем
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
        <ul className="space-y-3">
          {[0, 1].map((key) => (
            <li key={key} className="h-32 animate-pulse rounded-3xl bg-paper-shade" />
          ))}
        </ul>
      )}

      {products !== null && products.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-display text-lg text-ink-900">Скоро здесь появятся мультфильмы</p>
          <p className="mt-2 text-sm text-ink-800">
            Мы дорисовываем первые истории. Оставьте заявку в Telegram - напишем, как только всё
            будет готово
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
        <ul className="space-y-3">
          {products.map((product) => (
            <li key={product.id}>
              <Card
                interactive
                onClick={() => chooseProduct(product)}
                className="overflow-hidden p-0"
              >
                {product.previewUrl ? (
                  <video
                    src={product.previewUrl}
                    className="aspect-video w-full bg-night-950 object-cover"
                    muted
                    loop
                    playsInline
                    preload="none"
                    onMouseEnter={(event) => void event.currentTarget.play().catch(() => undefined)}
                    onMouseLeave={(event) => event.currentTarget.pause()}
                  />
                ) : (
                  <div className="flex aspect-video w-full items-center justify-center bg-night-900">
                    <FilmSlate className="h-10 w-10 text-moon-300" />
                  </div>
                )}
                <div className="space-y-1.5 p-5">
                  <h2 className="font-display text-xl text-ink-900">{product.title}</h2>
                  {product.tagline && <p className="text-sm text-ink-800">{product.tagline}</p>}
                  <p className="flex items-baseline gap-2 pt-1">
                    <span className="font-display text-lg text-mustard-deep">
                      {formatRub(product.priceTokens * TOKEN_TO_RUB)}
                    </span>
                    <span className="text-xs text-ink-500">{product.sceneCount} сцен</span>
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
