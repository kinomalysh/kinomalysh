import { api } from '@/shared/api/client'

export interface CatalogProduct {
  id: string
  slug: string
  title: string
  tagline: string | null
  description: string | null
  priceTokens: number
  sceneCount: number
  previewUrl: string | null
}

export async function fetchCatalog(): Promise<CatalogProduct[]> {
  const { products } = await api<{ products: CatalogProduct[] }>('/catalog', { auth: false })
  return products
}

export async function fetchProduct(slug: string): Promise<CatalogProduct> {
  const { product } = await api<{ product: CatalogProduct }>(`/catalog/${slug}`, { auth: false })
  return product
}
