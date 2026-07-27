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
export const IMAGE_EDIT_MODEL = 'fal-ai/nano-banana/edit'

export function estimateVideoCostUsd(heroSceneCount: number): number {
  return Number((heroSceneCount * VIDEO_MODEL.costUsdPerClip).toFixed(2))
}

export type ReelKind = 't2v' | 'i2v'

export const REEL_STYLE =
  'Pixar-style 3D animation, adorable characters with huge glossy expressive eyes and soft rounded features, warm cozy cinematic lighting, soft shadows, high-end render quality, shallow depth of field, vertical 9:16 composition, single continuous shot, smooth gentle camera movement, no text'

export const REEL_NEGATIVE_PROMPT =
  'text, letters, captions, watermark, logo, extra fingers, deformed hands, three arms, creepy face, uncanny valley, photorealistic human skin, exaggerated bulging eyes, fast cuts, shaky camera, glitch, low quality'

export function buildReelPrompt(scenePrompt: string): string {
  const scene = scenePrompt.trim().replace(/\.$/, '')
  return `${scene}, ${REEL_STYLE}`
}
