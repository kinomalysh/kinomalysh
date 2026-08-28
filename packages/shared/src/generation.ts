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
export const IMAGE_EDIT_MODEL = 'fal-ai/nano-banana-pro/edit'

export const INTRO_CLIP_KEY = 'assets/kinomalysh-intro.mp4'
export const SCENE_CROSSFADE_SECONDS = 0.6

export function estimateVideoCostUsd(heroSceneCount: number): number {
  return Number((heroSceneCount * VIDEO_MODEL.costUsdPerClip).toFixed(2))
}

export type ReelKind = 't2v' | 'i2v'

export const REEL_STYLE =
  'soft stylized 3D cartoon animation, adorable characters with huge glossy expressive eyes and soft rounded features, warm cozy cinematic lighting, soft shadows, high-end render quality, shallow depth of field, vertical 9:16 composition, single continuous shot, smooth gentle camera movement, no text'

export const REEL_NEGATIVE_PROMPT =
  'text, letters, captions, watermark, logo, extra fingers, deformed hands, three arms, creepy face, uncanny valley, photorealistic human skin, exaggerated bulging eyes, fast cuts, shaky camera, glitch, low quality'

export function buildReelPrompt(scenePrompt: string): string {
  const scene = scenePrompt.trim().replace(/\.$/, '')
  return `${scene}, ${REEL_STYLE}`
}

export type SceneKind = 'hero' | 'library' | 'title'

export const PRODUCT_STYLE =
  'soft stylized 3D cartoon animation, glossy expressive eyes, soft rounded features, warm cinematic lighting, deep indigo night palette with golden accents, storybook mood, no text'

export function buildProductScenePrompt(prompt: string): string {
  const scene = prompt.trim().replace(/\.$/, '')
  return `${scene}, ${PRODUCT_STYLE}`
}

export const ELEVEN_VOICE_LUNYA = 'rSfuQoQ3FY8SVKeraMAp'
export const ELEVEN_MODEL = 'eleven_v3'

export const CASTING_VARIANTS = 3
export const MAX_CASTING_ATTEMPTS = 2

export function castingCostUsd(variants = CASTING_VARIANTS): number {
  return Number((variants * 0.13).toFixed(2))
}
