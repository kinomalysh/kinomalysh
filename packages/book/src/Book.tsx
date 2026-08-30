import {
  Defs,
  Document,
  Font,
  Image,
  LinearGradient,
  Page,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer'
import { COLORS, PAGE_SIZE, SPACE, TYPE, zoneForPage } from './design.js'
import type { TextZone } from './design.js'
import type { BookPage, BookSpec } from './types.js'

export function registerFonts(fontDir: string): void {
  Font.register({
    family: 'Nunito',
    fonts: [
      { src: `${fontDir}/Nunito-Regular.ttf`, fontWeight: 400 },
      { src: `${fontDir}/Nunito-Bold.ttf`, fontWeight: 700 },
      { src: `${fontDir}/Nunito-ExtraBold.ttf`, fontWeight: 800 },
    ],
  })
  Font.registerHyphenationCallback((word: string) => [word])
}

const styles = StyleSheet.create({
  page: { position: 'relative', backgroundColor: COLORS.indigo },
  art: { position: 'absolute', top: 0, left: 0, width: PAGE_SIZE, height: PAGE_SIZE },
  scrim: { position: 'absolute', left: 0, width: PAGE_SIZE, height: PAGE_SIZE * 0.62 },
  card: {
    position: 'absolute',
    left: SPACE.margin,
    right: SPACE.margin,
    backgroundColor: COLORS.cream,
    borderRadius: SPACE.cardRadius,
    padding: SPACE.cardPadding,
  },
  bodyText: {
    fontFamily: 'Nunito',
    fontWeight: 700,
    fontSize: TYPE.body,
    lineHeight: TYPE.bodyLead,
    color: COLORS.ink,
  },
  coverWrap: {
    position: 'absolute',
    left: SPACE.margin,
    right: SPACE.margin,
    bottom: SPACE.margin + 10,
    alignItems: 'center',
  },
  coverTitle: {
    fontFamily: 'Nunito',
    fontWeight: 800,
    fontSize: TYPE.cover,
    color: COLORS.cream,
    textAlign: 'center',
  },
  coverRule: {
    marginTop: 14,
    marginBottom: 12,
    width: 74,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gold,
  },
  coverName: {
    fontFamily: 'Nunito',
    fontWeight: 700,
    fontSize: TYPE.coverName,
    color: COLORS.gold,
    textAlign: 'center',
  },
  folio: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Nunito',
    fontWeight: 700,
    fontSize: TYPE.caption,
    color: COLORS.cream,
    opacity: 0.65,
  },
})

function Scrim({ id, zone, strength }: { id: string; zone: TextZone; strength: number }) {
  const stops =
    zone === 'bottom'
      ? [
          { offset: '0', opacity: 0 },
          { offset: '0.45', opacity: strength * 0.45 },
          { offset: '1', opacity: strength },
        ]
      : [
          { offset: '0', opacity: strength },
          { offset: '0.55', opacity: strength * 0.45 },
          { offset: '1', opacity: 0 },
        ]

  return (
    <Svg
      style={[styles.scrim, zone === 'bottom' ? { bottom: 0 } : { top: 0 }]}
      viewBox="0 0 10 10"
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {stops.map((s) => (
            <Stop
              key={s.offset}
              offset={s.offset}
              stopColor={COLORS.indigo}
              stopOpacity={String(s.opacity)}
            />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="10" height="10" fill={`url(#${id})`} />
    </Svg>
  )
}

function Cover({ spec }: { spec: BookSpec }) {
  return (
    <Page size={[PAGE_SIZE, PAGE_SIZE]} style={styles.page}>
      {spec.coverImage ? <Image src={spec.coverImage} style={styles.art} /> : null}
      <Scrim id="scrim-cover" zone="bottom" strength={0.82} />
      <View style={styles.coverWrap}>
        <Text style={styles.coverTitle}>{spec.title}</Text>
        <View style={styles.coverRule} />
        <Text style={styles.coverName}>Сказка для {spec.childName}</Text>
      </View>
    </Page>
  )
}

function StoryPage({ page, index }: { page: BookPage; index: number }) {
  const zone = zoneForPage(index)
  const cardPosition = zone === 'bottom' ? { bottom: SPACE.margin } : { top: SPACE.margin }

  return (
    <Page size={[PAGE_SIZE, PAGE_SIZE]} style={styles.page}>
      <Image src={page.image} style={styles.art} />
      <Scrim id={`scrim-${index}`} zone={zone} strength={0.4} />
      <View style={[styles.card, cardPosition]}>
        <Text style={styles.bodyText}>{page.text}</Text>
      </View>
      <Text style={styles.folio}>{index + 1}</Text>
    </Page>
  )
}

export function BookDocument({ spec }: { spec: BookSpec }) {
  return (
    <Document title={spec.title} author="Киномалыш">
      {spec.withCover === false ? null : <Cover spec={spec} />}
      {spec.pages.map((page, i) => (
        <StoryPage key={i} page={page} index={i} />
      ))}
    </Document>
  )
}
