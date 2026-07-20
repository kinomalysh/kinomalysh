import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CaretRight,
  Coins,
  FileText,
  Gift,
  Lifebuoy,
  ShieldCheck,
} from '@phosphor-icons/react'
import { Button } from '@/shared/ui/Button'
import { cn } from '@/shared/lib/cn'
import { formatRub, formatTokens, plural } from '@/shared/lib/format'
import { BRAND, ROUTES } from '@/shared/config/routes'
import { PACKS, PRICE_VIDEO_TOKENS } from '@/entities/pricing/model'
import { useUser } from '@/entities/user/model'
import { useLibrary } from '@/entities/story/model'
import { asset } from '@/shared/lib/asset'
import { useSeo } from '@/shared/lib/seo'

const MENU = [
  {
    icon: Gift,
    label: 'Подарочный сертификат',
    hint: 'Подарите сказку близким',
    chip: 'bg-poppy/15 text-poppy',
    to: null,
  },
  {
    icon: Lifebuoy,
    label: 'Поддержка',
    hint: 'Отвечаем быстро, по-человечески',
    chip: 'bg-mustard/20 text-mustard',
    to: null,
  },
  {
    icon: FileText,
    label: 'Пользовательское соглашение',
    hint: 'Коротко и без канцелярита',
    chip: 'bg-lilac-500/20 text-lilac-500',
    to: ROUTES.terms,
  },
  {
    icon: ShieldCheck,
    label: 'Мои данные',
    hint: 'Что храним и как удалить',
    chip: 'bg-leaf/15 text-leaf',
    to: ROUTES.privacy,
  },
]

export function ProfilePage() {
  useSeo('profile')
  const navigate = useNavigate()
  const name = useUser((s) => s.name)
  const balance = useUser((s) => s.balance)
  const topUp = useUser((s) => s.topUp)
  const storiesCount = useLibrary((s) => s.stories.length)
  const [selected, setSelected] = useState<string>('pack-family')
  const [justPaid, setJustPaid] = useState(false)

  const filmsLeft = Math.floor(balance / PRICE_VIDEO_TOKENS)
  const balanceNote =
    filmsLeft > 0
      ? `хватит на ${filmsLeft} ${plural(filmsLeft, 'мультфильм', 'мультфильма', 'мультфильмов')}`
      : balance >= 25
        ? 'хватит на книгу с озвучкой'
        : 'пора подсыпать волшебства'

  const handleTopup = () => {
    const pack = PACKS.find((p) => p.id === selected)
    if (!pack) return
    topUp(pack.tokens)
    setJustPaid(true)
    setTimeout(() => setJustPaid(false), 2500)
  }

  return (
    <div className="space-y-8 pt-2 animate-rise">
      <section aria-label="Читательский билет" className="pt-2">
        <div className="sticker rotate-[-0.8deg] rounded-3xl p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="hand-note text-lg rotate-[-1deg]">
              читательский билет {BRAND.toLowerCase()}а
            </p>
            <img
              src={asset('logo.svg')}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rotate-[6deg] rounded-lg border-2 border-ink-900"
            />
          </div>
          <p className="mt-1 font-display text-2xl text-ink-900">{name}</p>
          <div className="mt-4 border-t-2 border-dashed border-ink-900/15 pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-mustard" />
                <span className="font-display text-xl text-ink-900">{formatTokens(balance)}</span>
              </span>
              <span className="hand-note text-base">{balanceNote}</span>
            </div>
            <p className="mt-2 text-xs text-ink-500">
              На полке {storiesCount} {plural(storiesCount, 'сказка', 'сказки', 'сказок')} · токены
              не сгорают
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="topup-heading" className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="hand-note shrink-0 text-lg rotate-[-2deg]">запасы</span>
          <h2 id="topup-heading" className="font-display text-xl text-ink-900">
            Пополнить волшебство
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Пакеты пополнения">
          {PACKS.map((pack, i) => (
            <button
              key={pack.id}
              type="button"
              role="radio"
              aria-checked={selected === pack.id}
              onClick={() => setSelected(pack.id)}
              className={cn(
                'relative rounded-2xl p-4 text-left cursor-pointer transition-all duration-200',
                selected === pack.id
                  ? cn('sticker scale-[1.02]', i % 2 === 0 ? 'rotate-[-1deg]' : 'rotate-[1deg]')
                  : 'paper hover:-translate-y-0.5',
              )}
            >
              {pack.badge && (
                <span className="absolute -top-2.5 right-3 rounded-full border-2 border-ink-900 bg-poppy px-2 py-0.5 text-[9px] font-bold text-on-poppy">
                  {pack.badge}
                </span>
              )}
              <span className="block text-xs font-semibold text-ink-800">{pack.label}</span>
              <span className="mt-1 block font-display text-xl text-ink-900">
                {formatRub(pack.rub)}
              </span>
              <span
                className={cn(
                  'mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold',
                  selected === pack.id
                    ? 'bg-mustard text-night-950'
                    : 'bg-paper-shade text-ink-800',
                )}
              >
                {formatTokens(pack.tokens)}
              </span>
            </button>
          ))}
        </div>
        <Button size="lg" className="w-full" onClick={handleTopup}>
          {justPaid ? 'Зачислено!' : 'Пополнить картой'}
        </Button>
      </section>

      <section aria-label="Настройки и помощь" className="space-y-3">
        <p className="hand-note text-lg rotate-[-1deg]">мелочи, но важные</p>
        <div className="space-y-2">
          {MENU.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.to ? () => navigate(item.to) : undefined}
              className="paper flex w-full cursor-pointer items-center gap-4 rounded-3xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                  item.chip,
                )}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink-900">{item.label}</span>
                <span className="block text-xs text-ink-500">{item.hint}</span>
              </span>
              <CaretRight className="h-4 w-4 shrink-0 text-ink-500" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
