import { SpeakerSimpleHigh } from '@phosphor-icons/react'
import { useReveal } from '@/shared/lib/useReveal'
import { asset } from '@/shared/lib/asset'

export function DemoReel() {
  const ref = useReveal<HTMLElement>()
  return (
    <section ref={ref} id="demo-reel" aria-label="Фрагмент настоящей сказки" className="shell py-6 lg:py-10">
      <figure className="reveal mx-auto max-w-4xl">
        <div className="sticker overflow-hidden rounded-[2rem] rotate-[0.6deg]">
          <video
            src={asset('story-demo.mp4')}
            poster={asset('plots/sleep.webp')}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="block aspect-video w-full object-cover"
          />
        </div>
        <figcaption className="mt-3 flex items-start justify-between gap-3 px-2">
          <span className="hand-note rotate-[-1deg] text-lg lg:text-xl">
            фрагмент настоящей сказки «Луна ждёт в гости»
          </span>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-800">
            <SpeakerSimpleHigh className="h-3.5 w-3.5" />
            в полной версии - озвучка и музыка
          </span>
        </figcaption>
      </figure>
    </section>
  )
}
