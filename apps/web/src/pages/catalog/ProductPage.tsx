import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/shared/ui/Card'
import { Button } from '@/shared/ui/Button'
import { useSeoMeta } from '@/shared/lib/seo'
import { ROUTES } from '@/shared/config/routes'
import { fetchProduct, type CatalogProduct } from '@/entities/catalog/model'
import { useWizard } from '@/features/wizard/model'
import { BookProductCard } from '@/widgets/product/BookProductCard'
import { VideoProductCard } from '@/widgets/product/VideoProductCard'

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const chooseProduct = useWizard((s) => s.chooseProduct)
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setProduct(null)
    setError(null)
    fetchProduct(slug)
      .then(setProduct)
      .catch(() => setError('Такой сказки нет или она снята с продажи'))
  }, [slug])

  useSeoMeta({
    path: product ? `/knigi/${product.slug}` : '/knigi',
    title: product ? `${product.title} - персональная сказка · Киномалыш` : 'Сказка · Киномалыш',
    description:
      product?.tagline ??
      product?.about?.slice(0, 160) ??
      'Персональная сказка, где главный герой - ваш ребёнок',
  })

  const order = () => {
    if (!product) return
    chooseProduct(product)
    navigate(ROUTES.create)
  }

  if (error) {
    return (
      <div className="shell pt-10">
        <Card className="p-10 text-center">
          <p className="font-display text-lg text-ink-900">{error}</p>
          <Button className="mt-5" onClick={() => navigate(ROUTES.books)}>
            Ко всем сказкам
          </Button>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="shell space-y-4 pt-10">
        <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-paper-shade" />
        <div className="aspect-square w-full max-w-md animate-pulse rounded-3xl bg-paper-shade" />
      </div>
    )
  }

  return (
    <div className="shell pt-4 animate-rise lg:pt-10">
      {product.kind === 'book' ? (
        <BookProductCard product={product} onOrder={order} />
      ) : (
        <VideoProductCard product={product} onOrder={order} />
      )}
    </div>
  )
}
