export const ROUTES = {
  home: '/',
  create: '/create',
  books: '/knigi',
  bookPattern: '/knigi/:slug',
  book: (slug: string) => `/knigi/${slug}`,
  cartoons: '/multfilmy',
  cartoonPattern: '/multfilmy/:slug',
  cartoon: (slug: string) => `/multfilmy/${slug}`,
  library: '/library',
  story: (id: string | number) => `/story/${id}`,
  storyPattern: '/story/:id',
  profile: '/profile',
  terms: '/terms',
  privacy: '/privacy',
  auth: '/auth',
  paymentResult: '/payment-result',
} as const

export const BRAND = 'Киномалыш'
export const TOKEN_TO_RUB = 10
