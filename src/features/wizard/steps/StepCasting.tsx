import { ArrowsClockwise, Sparkle, MagicWand } from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { useWizard } from '@/features/wizard/model'
import type { AvatarVariant } from '@/features/wizard/model'
import { cn } from '@/shared/lib/cn'

function AvatarArt({ variant, name }: { variant: AvatarVariant; name: string }) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <div
      aria-hidden
      className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(160deg, hsl(${variant.hue} 45% 22%), hsl(${variant.accentHue} 55% 14%))`,
      }}
    >
      <span
        className="flex h-20 w-20 items-center justify-center rounded-full font-display text-4xl text-night-950"
        style={{
          background: `radial-gradient(circle at 35% 30%, hsl(${variant.accentHue} 70% 60%), hsl(${variant.hue} 60% 38%))`,
          boxShadow: `0 0 40px hsl(${variant.accentHue} 70% 55% / 0.45)`,
        }}
      >
        {initial || <Sparkle weight="fill" className="h-8 w-8 text-cream" />}
      </span>
      <Sparkle className="absolute right-3 top-3 h-4 w-4 text-white/40" />
      <span className="absolute bottom-2 left-0 right-0 text-center text-[10px] uppercase tracking-widest text-white/35">
        предпросмотр
      </span>
    </div>
  )
}

export function StepCasting() {
  const castingLoading = useWizard((s) => s.castingLoading)
  const avatars = useWizard((s) => s.avatars)
  const chosenAvatar = useWizard((s) => s.chosenAvatar)
  const childName = useWizard((s) => s.childName)
  const chooseAvatar = useWizard((s) => s.chooseAvatar)
  const recast = useWizard((s) => s.recast)

  return (
    <div className="space-y-6 animate-rise">
      <header className="space-y-2">
        <h1 className="font-display text-2xl text-ink-900">Кастинг героя</h1>
        <p className="text-sm text-ink-800">
          Нейросеть нарисовала три варианта. Выберите того, кто больше похож на{' '}
          {childName.trim() || 'вашего ребёнка'}
        </p>
      </header>

      {castingLoading ? (
        <div className="flex flex-col items-center gap-5 rounded-3xl paper p-10 text-center">
          <span className="relative flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-mustard/40" />
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mustard/25">
              <MagicWand className="h-6 w-6 animate-pulse text-mustard-deep" />
            </span>
          </span>
          <div className="space-y-1">
            <p className="font-medium text-ink-900">Художник за работой…</p>
            <p className="text-xs text-ink-500">Обычно это занимает 2–3 минуты</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Варианты героя">
            {avatars.map((v) => (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={chosenAvatar === v.id}
                onClick={() => chooseAvatar(v.id)}
                className={cn(
                  'rounded-2xl border-2 p-1 cursor-pointer transition-all duration-200 active:scale-[0.97]',
                  chosenAvatar === v.id
                    ? 'border-poppy'
                    : 'border-transparent hover:border-ink-900/40',
                )}
              >
                <AvatarArt variant={v} name={childName} />
              </button>
            ))}
          </div>
          <Button variant="secondary" className="w-full" onClick={recast}>
            <ArrowsClockwise className="h-4 w-4" />
            Ещё варианты — бесплатно
          </Button>
        </>
      )}
    </div>
  )
}
