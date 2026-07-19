import { cn } from '@/shared/lib/cn'

interface NightWindowProps {
  className?: string
  caption?: string
}

const STARS = [
  { x: 34, y: 26, r: 1.6, d: '0s' },
  { x: 78, y: 18, r: 1.2, d: '1.2s' },
  { x: 132, y: 40, r: 1.8, d: '2.1s' },
  { x: 196, y: 22, r: 1.3, d: '0.6s' },
  { x: 236, y: 52, r: 1.7, d: '1.7s' },
  { x: 58, y: 66, r: 1.2, d: '2.8s' },
  { x: 168, y: 72, r: 1.4, d: '0.9s' },
  { x: 262, y: 30, r: 1.2, d: '2.4s' },
  { x: 105, y: 20, r: 1.1, d: '3.1s' },
]

export function NightWindow({ className, caption }: NightWindowProps) {
  return (
    <figure className={cn('relative', className)}>
      <div className="sticker overflow-hidden rounded-[2rem] animate-floaty">
        <svg
          viewBox="0 0 300 240"
          role="img"
          aria-label="Аппликация: ребёнок летит над ночными холмами к луне"
          className="block w-full"
        >
          <rect width="300" height="240" fill="#16204d" />
          <rect width="300" height="150" fill="#1c2754" />
          {STARS.map((s) => (
            <circle
              key={`${s.x}-${s.y}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill="#f5e9c9"
              className="animate-twinkle"
              style={{ animationDelay: s.d }}
            />
          ))}
          <g className="animate-shoot">
            <circle cx="120" cy="34" r="1.6" fill="#f5e9c9" />
            <path d="M120 34 l26 -13" stroke="#f5e9c9" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          </g>
          <g className="animate-moonglow">
          <g className="animate-sway" style={{ transformOrigin: '228px 62px' }}>
            <circle cx="228" cy="62" r="30" fill="#f2b33d" />
            <circle cx="238" cy="54" r="26" fill="#ffd98a" />
            <circle cx="220" cy="54" r="4" fill="#e8a92c" opacity="0.6" />
            <circle cx="232" cy="72" r="3" fill="#e8a92c" opacity="0.5" />
          </g>
          </g>
          <path d="M0 168 Q75 128 150 164 T300 158 V240 H0 Z" fill="#27336b" />
          <path d="M0 196 Q90 158 180 192 T300 188 V240 H0 Z" fill="#10173a" />
          <g transform="translate(96 96) rotate(-8)">
            <ellipse cx="30" cy="34" rx="26" ry="9" fill="#e04e39" />
            <path d="M4 34 Q-6 30 -10 22 L-2 30 Z" fill="#b93a28" />
            <circle cx="48" cy="26" r="9" fill="#f6c9a0" />
            <path d="M40 20 q8 -7 16 -1 q-2 -6 -9 -6 q-6 0 -7 7z" fill="#232a45" />
            <rect x="18" y="26" width="26" height="10" rx="5" fill="#3e8e5a" />
          </g>
          <g fill="#f5e9c9" opacity="0.85">
            <path d="M60 120 l2.4 5 5 .8 -3.7 3.6 .9 5 -4.6 -2.4 -4.5 2.4 .8 -5 -3.6 -3.6 5 -.8 Z" />
          </g>
          <path d="M148 210 q6 -14 18 -9 q-2 -9 8 -11" stroke="#f5e9c9" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.35" />
        </svg>
      </div>
      {caption && (
        <figcaption className="hand-note absolute -bottom-7 right-6 rotate-[-2deg] text-lg">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
