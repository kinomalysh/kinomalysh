export interface VideoModelConfig {
  model: string
  resolution: '360p' | '540p' | '720p' | '1080p'
  duration: number
  generateAudio: boolean
  costUsdPerClip: number
}

export const VIDEO_MODEL: VideoModelConfig = {
  model: 'fal-ai/pixverse/v5.5/image-to-video',
  resolution: '1080p',
  duration: 8,
  generateAudio: false,
  costUsdPerClip: 0.8,
}

export const IMAGE_MODEL = 'fal-ai/nano-banana-2'

export function estimateVideoCostUsd(heroSceneCount: number): number {
  return Number((heroSceneCount * VIDEO_MODEL.costUsdPerClip).toFixed(2))
}
