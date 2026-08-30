import type { TextZone } from './design.js'

export const BOOK_ILLUSTRATION_STYLE =
  'soft stylized 3D cartoon illustration for a children picture book, adorable character with huge glossy expressive eyes and soft rounded features, warm cinematic lighting, deep indigo night palette with golden accents, painterly storybook atmosphere, full-bleed square composition'

const ZONE_HINT: Record<TextZone, string> = {
  bottom:
    'Compose so the lower third of the image stays visually calm and uncluttered - soft sky, blanket, floor or gentle gradient - because a caption will be placed there. Keep faces and key action in the upper two thirds.',
  top: 'Compose so the upper third of the image stays visually calm and uncluttered - soft sky, wall or gentle gradient - because a caption will be placed there. Keep faces and key action in the lower two thirds.',
}

const NO_TEXT_GUARD =
  'Draw no text, no letters, no words, no captions, no numbers and no signage anywhere in the image - all wording is added later as a separate layer.'

export const BOOK_NEGATIVE_PROMPT =
  'text, letters, words, captions, numbers, signage, watermark, logo, split screen, collage, grid, panels, borders, frames, extra fingers, deformed hands, creepy face, photorealistic human skin, low quality'

export function buildBookPagePrompt(scenePrompt: string, zone: TextZone): string {
  const scene = scenePrompt.trim().replace(/\.$/, '')
  return `${scene}, ${BOOK_ILLUSTRATION_STYLE}. ${ZONE_HINT[zone]} ${NO_TEXT_GUARD}`
}
