import { api, apiUpload } from '@/shared/api/client'

export type OrderStatus =
  | 'casting'
  | 'awaiting_choice'
  | 'awaiting_details'
  | 'awaiting_payment'
  | 'rendering'
  | 'ready'
  | 'failed'
  | 'expired'

export type OrderStage =
  | 'casting'
  | 'awaiting_payment'
  | 'queued'
  | 'rendering'
  | 'assembling'
  | 'ready'
  | 'failed'
  | 'expired'

export interface OrderProgress {
  stage: OrderStage
  done: number
  total: number
  percent: number
}

export interface Order {
  id: string
  status: OrderStatus
  castingUrls: string[]
  castingAttemptsLeft: number
  productId: string | null
  product: { slug: string; title: string } | null
  childName: string | null
  gender: string | null
  tokensCost: number | null
  resultUrl: string | null
  progress: OrderProgress | null
  expiresAt: string | null
  daysLeft: number | null
  photoPurged: boolean
  failReason: string | null
  createdAt: string
}

export interface NewOrderInput {
  slug: string
  photo: File
  childName: string
  gender: 'male' | 'female'
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  casting: 'Рисуем портреты',
  awaiting_choice: 'Ждёт вашего выбора',
  awaiting_details: 'Ждёт деталей',
  awaiting_payment: 'Ждёт оплаты',
  rendering: 'Собираем мультфильм',
  ready: 'Готов',
  failed: 'Не получилось',
  expired: 'Срок хранения истёк',
}

export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  casting: 'Рисуем портреты героя',
  awaiting_payment: 'Ждём оплату',
  queued: 'Заказ в очереди',
  rendering: 'Рисуем сцены с вашим ребёнком',
  assembling: 'Монтируем и накладываем озвучку',
  ready: 'Мультфильм готов',
  failed: 'Сборка не удалась',
  expired: 'Файл удалён по сроку хранения',
}

export async function fetchOrders(): Promise<Order[]> {
  const { stories } = await api<{ stories: Order[] }>('/stories')
  return stories
}

export async function fetchOrder(id: string): Promise<Order> {
  const { story } = await api<{ story: Order }>(`/stories/${id}`)
  return story
}

export async function createProductOrder(input: NewOrderInput): Promise<Order> {
  const query = new URLSearchParams({
    childName: input.childName,
    gender: input.gender,
    consentGuardian: 'true',
    consentTransfer: 'true',
  })
  const form = new FormData()
  form.append('photo', input.photo)
  const { story } = await apiUpload<{ story: Order }>(
    `/stories/product/${input.slug}?${query.toString()}`,
    form,
  )
  return story
}

export async function payOrder(id: string): Promise<Order> {
  const { story } = await api<{ story: Order }>(`/stories/${id}/pay`, { method: 'POST' })
  return story
}

export async function deleteOrder(id: string): Promise<void> {
  await api(`/stories/${id}`, { method: 'DELETE' })
}

export async function chooseAvatar(id: string, avatarIndex: number): Promise<Order> {
  const { story } = await api<{ story: Order }>(`/stories/${id}/avatar`, {
    method: 'POST',
    body: { avatarIndex },
  })
  return story
}

export async function recast(id: string): Promise<void> {
  await api(`/stories/${id}/recast`, { method: 'POST' })
}
