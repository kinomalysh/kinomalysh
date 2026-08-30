export const PAGE_SIZE = 612

export const COLORS = {
  indigo: '#1B1638',
  ink: '#2A2140',
  cream: '#FFFAF2',
  gold: '#F5B840',
  goldDeep: '#D89A22',
} as const

export const SPACE = {
  margin: 40,
  cardPadding: 30,
  cardRadius: 30,
} as const

export const TYPE = {
  cover: 46,
  coverName: 30,
  body: 21,
  bodyLead: 1.45,
  caption: 12,
} as const

export type TextZone = 'bottom' | 'top'

export function zoneForPage(position: number): TextZone {
  return position % 2 === 0 ? 'top' : 'bottom'
}
