export const QUEUE_CASTING = 'casting'
export const QUEUE_RENDER = 'render'
export const QUEUE_ADREEL = 'adreel'

export interface CastingJobData {
  storyId: string
}

export interface RenderJobData {
  storyId: string
}

export interface AdReelJobData {
  reelId: string
}
