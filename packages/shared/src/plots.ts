export interface PlotDef {
  id: string
  title: string
  tagline: string
  benefit: string
  ages: string
  premium: boolean
  scenePrompts: string[]
}

const STYLE =
  'Disney Pixar animation style, 3D render, oversized expressive eyes, soft rounded features, deep indigo night palette with warm golden light, cinematic teal-orange color grade, storybook composition, no text'

export const PLOTS: PlotDef[] = [
  {
    id: 'emotions',
    title: 'Большие эмоции',
    tagline: 'Про злость, грусть и радость — через образы погоды',
    benefit: 'Учит понимать чувства',
    ages: '3–7',
    premium: false,
    scenePrompts: [
      `The hero child meets a tiny grumpy red thundercloud on a moonlit hill, ${STYLE}`,
      `The hero child comforts a teary little blue rain cloud, ${STYLE}`,
      `The hero child laughs with a warm smiling golden sun lantern, ${STYLE}`,
      `The hero child hugs all three weather spirits under the stars, happy ending, ${STYLE}`,
    ],
  },
  {
    id: 'sleep',
    title: 'Луна ждёт в гости',
    tagline: 'Мягкое путешествие по звёздному небу перед сном',
    benefit: 'Помогает уснуть',
    ages: '2–6',
    premium: false,
    scenePrompts: [
      `The hero child boards a little red paper airplane at night, ${STYLE}`,
      `The hero child flies over rolling midnight-blue hills, ${STYLE}`,
      `The hero child greets a huge friendly smiling crescent moon, ${STYLE}`,
      `The hero child falls asleep on a soft cloud, peaceful ending, ${STYLE}`,
    ],
  },
  {
    id: 'teeth',
    title: 'Миссия Зубной Щётки',
    tagline: 'Весёлая охота на микробов утром и вечером',
    benefit: 'Приучает чистить зубы',
    ages: '2–6',
    premium: false,
    scenePrompts: [
      `The hero child receives a glowing magic toothbrush like a knight sword, ${STYLE}`,
      `Funny cartoon germ monsters sneak in a cozy bathroom at night, ${STYLE}`,
      `The hero child heroically chases the fleeing germ monsters, ${STYLE}`,
      `The hero child smiles with sparkling clean teeth, victory ending, ${STYLE}`,
    ],
  },
  {
    id: 'explorer',
    title: 'Великий исследователь',
    tagline: 'Обычный дом превращается в мир открытий',
    benefit: 'Развивает любознательность',
    ages: '3–8',
    premium: false,
    scenePrompts: [
      `The hero child in a paper pirate hat holds a flashlight in a dark living room, ${STYLE}`,
      `Houseplants transform into a magical glowing jungle, ${STYLE}`,
      `The hero child discovers a treasure of family photos, ${STYLE}`,
      `The hero child tells parents about the adventure, warm ending, ${STYLE}`,
    ],
  },
  {
    id: 'helper',
    title: 'Золотые помощники',
    tagline: 'Уборка становится супергеройской миссией',
    benefit: 'Учит помогать по дому',
    ages: '3–8',
    premium: false,
    scenePrompts: [
      `The hero child puts on a superhero cape made of a striped towel, ${STYLE}`,
      `Toys magically fly into a toy box guided by the hero child, ${STYLE}`,
      `The hero child rides a broom like a hero staff, sparkles everywhere, ${STYLE}`,
      `Proud parents hug the hero child in a tidy room, ${STYLE}`,
    ],
  },
  {
    id: 'space-hero',
    title: 'Звёздный защитник',
    tagline: 'Эпическое приключение с полётами и превращениями',
    benefit: 'Супергеройский сюжет',
    ages: '5–10',
    premium: true,
    scenePrompts: [
      `The hero child in an astronaut super-suit launches into deep space, ${STYLE}`,
      `The hero child flies among golden stars with a flowing cape, ${STYLE}`,
      `The hero child shields a small glowing friendly planet from a comet, epic, ${STYLE}`,
      `The grateful planet smiles as the hero child waves goodbye, ${STYLE}`,
      `The hero child returns home to bed, falls asleep smiling, ${STYLE}`,
    ],
  },
]

export function getPlotDef(id: string): PlotDef | undefined {
  return PLOTS.find((p) => p.id === id)
}
