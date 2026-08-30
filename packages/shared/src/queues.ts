export const QUEUE_CASTING = 'casting'
export const QUEUE_RENDER = 'render'
export const QUEUE_ADREEL = 'adreel'
export const QUEUE_SCENE = 'scene-asset'
export const QUEUE_PRODUCT_ORDER = 'product-order'
export const QUEUE_BOOK_PAGE = 'book-page'
export const QUEUE_HOUSEKEEPING = 'housekeeping'

export interface CastingJobData {
  storyId: string
}

export interface RenderJobData {
  storyId: string
}

export interface AdReelJobData {
  reelId: string
}

export interface SceneAssetJobData {
  sceneId: string
  target: 'clip' | 'vo'
}

export interface BookPageJobData {
  pageId: string
}

export interface ProductOrderJobData {
  storyId: string
}

export interface HousekeepingJobData {
  reason?: string
}
