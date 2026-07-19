export const ROUTES = {
  home: '/',
  create: '/create',
  library: '/library',
  story: (id: string | number) => `/story/${id}`,
  storyPattern: '/story/:id',
  profile: '/profile',
  terms: '/terms',
  privacy: '/privacy',
  auth: '/auth',
} as const

export const BRAND = 'Огонёк'
export const TOKEN_TO_RUB = 10
