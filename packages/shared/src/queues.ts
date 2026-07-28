export const QUEUE_CASTING = 'casting'
export const QUEUE_RENDER = 'render'
export const QUEUE_ADREEL = 'adreel'
export const QUEUE_SCENE = 'scene-asset'

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
