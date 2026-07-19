import { Check, ArrowsClockwise } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { getPlot } from '@/entities/plot/model'
import { useWizard } from '@/features/wizard/model'

const SCENE_TITLES = ['Завязка', 'Приключение', 'Испытание', 'Счастливый финал']

export function StepScenes() {
  const plotId = useWizard((s) => s.plotId)
  const childName = useWizard((s) => s.childName)
  const approveScenes = useWizard((s) => s.approveScenes)
  const [seed, setSeed] = useState(0)
  const plot = getPlot(plotId ?? '')

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Кадры будущей сказки</h1>
        <p className="text-sm text-ink-800">
          Примерные сцены «{plot?.title}». Не понравятся — перегенерируем бесплатно
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2">
        {SCENE_TITLES.map((title, i) => (
          <figure
            key={`${title}-${seed}`}
            className="overflow-hidden rounded-2xl border border-ink-900/15 animate-rise"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div
              aria-hidden
              className="flex aspect-video items-center justify-center bg-gradient-to-br"
              style={{
                background: `linear-gradient(150deg, hsl(${(seed * 47 + i * 60) % 360} 40% 24%), hsl(${(seed * 47 + i * 60 + 40) % 360} 45% 12%))`,
              }}
            >
              {plot && <plot.icon className="h-7 w-7 text-white/50" />}
            </div>
            <figcaption className="bg-white px-3 py-2 text-[11px] text-ink-800">
              {i + 1}. {title}
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="rounded-2xl bg-mustard/15 border border-mustard-deep/40 p-4 text-xs leading-relaxed text-ink-800">
        Нейросеть — художник со своим взглядом: {childName.trim() || 'герой'} в каждой сцене живёт
        вместе с сюжетом — улыбается, удивляется, радуется.
      </p>

      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setSeed((s) => s + 1)}>
          <ArrowsClockwise className="h-4 w-4" />
          Ещё раз
        </Button>
        <Button className="flex-1" onClick={approveScenes}>
          <Check className="h-4 w-4" />
          Нравится
        </Button>
      </div>
    </div>
  )
}
