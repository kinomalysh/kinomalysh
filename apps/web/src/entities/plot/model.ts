import type { Icon } from '@phosphor-icons/react'
import { asset } from '@/shared/lib/asset'
import {
  CloudSun,
  Compass,
  Moon,
  Rocket,
  Sparkle,
  ToothbrushIcon,
} from '@/entities/plot/icons'

export interface Plot {
  id: string
  image: string
  title: string
  tagline: string
  benefit: string
  ages: string
  gradient: string
  icon: Icon
  premium?: boolean
}

export const PLOTS: Plot[] = [
  {
    id: 'emotions',
    image: asset('plots/emotions.webp'),
    title: 'Большие эмоции',
    tagline: 'Про злость, грусть и радость - через образы погоды',
    benefit: 'Учит понимать чувства',
    ages: '3-7',
    gradient: 'from-lilac-500/50 via-night-800 to-night-950',
    icon: CloudSun,
  },
  {
    id: 'sleep',
    image: asset('plots/sleep.webp'),
    title: 'Луна ждёт в гости',
    tagline: 'Мягкое путешествие по звёздному небу перед сном',
    benefit: 'Помогает уснуть',
    ages: '2-6',
    gradient: 'from-night-700 via-night-800 to-night-950',
    icon: Moon,
  },
  {
    id: 'teeth',
    image: asset('plots/teeth.webp'),
    title: 'Миссия Зубной Щётки',
    tagline: 'Весёлая охота на микробов утром и вечером',
    benefit: 'Приучает чистить зубы',
    ages: '2-6',
    gradient: 'from-mint-400/30 via-night-800 to-night-950',
    icon: ToothbrushIcon,
  },
  {
    id: 'explorer',
    image: asset('plots/explorer.webp'),
    title: 'Великий исследователь',
    tagline: 'Обычный дом превращается в мир открытий',
    benefit: 'Развивает любознательность',
    ages: '3-8',
    gradient: 'from-candle-400/40 via-night-800 to-night-950',
    icon: Compass,
  },
  {
    id: 'helper',
    image: asset('plots/helper.webp'),
    title: 'Золотые помощники',
    tagline: 'Уборка становится супергеройской миссией',
    benefit: 'Учит помогать по дому',
    ages: '3-8',
    gradient: 'from-coral-400/40 via-night-800 to-night-950',
    icon: Sparkle,
  },
  {
    id: 'space-hero',
    image: asset('plots/space-hero.webp'),
    title: 'Звёздный защитник',
    tagline: 'Эпическое приключение с полётами и превращениями',
    benefit: 'Супергеройский сюжет',
    ages: '5-10',
    gradient: 'from-rose-400/40 via-night-800 to-night-950',
    icon: Rocket,
    premium: true,
  },
]

export function getPlot(id: string): Plot | undefined {
  return PLOTS.find((p) => p.id === id)
}
