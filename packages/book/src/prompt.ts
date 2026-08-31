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

export const BOOK_COVER_STYLE =
  'cinematic movie-poster style cover illustration for a childrens picture book, soft stylized 3D cartoon rendering, one single hero character, warm cinematic key light against a deep indigo night palette with golden rim light, rich painterly detail, vertical 3:4 poster composition'

// Канон обложки: один фокус, крупное лицо героя с ясной эмоцией и взглядом в
// зрителя, читаемое даже в размере ногтя. Верхняя треть намеренно спокойная -
// туда ляжет название, которое мы рисуем сами шрифтом.
export function buildBookCoverPrompt(heroPrompt: string, mood: string): string {
  const hero = heroPrompt.trim().replace(/\.$/, '')
  return [
    'Draw ONE single portrait-format cover image, not a storyboard, not panels, not a collage.',
    `Subject: ${hero}.`,
    `Emotional tone: ${mood}.`,
    'Composition: the child fills the lower two thirds of the frame, head and shoulders large and close to camera, face fully visible, eyes looking straight at the viewer, expression clear and readable at thumbnail size.',
    'Keep the upper third calm and uncluttered - open sky, soft wall or gentle glow - a title will be placed there later.',
    'Never draw text, letters, words, numbers, captions, logos or signage anywhere in the image.',
    BOOK_COVER_STYLE,
  ].join(' ')
}
