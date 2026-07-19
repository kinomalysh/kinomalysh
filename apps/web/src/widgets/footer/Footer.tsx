import { Link } from 'react-router-dom'
import { PaperPlaneTilt, TelegramLogo } from '@phosphor-icons/react'
import { BRAND, ROUTES } from '@/shared/config/routes'
import { asset } from '@/shared/lib/asset'

const DOC_LINKS = [
  { to: ROUTES.terms, label: 'Пользовательское соглашение' },
  { to: ROUTES.privacy, label: 'Политика конфиденциальности' },
]

export function Footer() {
  return (
    <footer className="mt-4 border-t-2 border-dashed border-ink-900/15 pb-28 pt-10">
      <p className="hand-note text-center text-lg rotate-[-1deg]">
        — конец. но сказки только начинаются —
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src={asset('logo.png')}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rotate-[-4deg] rounded-xl border-2 border-ink-900"
            />
            <span className="font-display text-lg text-ink-900">{BRAND}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-800">
            Персональные сказки, где главную роль играет ваш ребёнок. Мультфильмы и книги с
            озвучкой — за 15 минут.
          </p>
        </div>

        <nav aria-label="Документы">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Документы</h3>
          <ul className="mt-3 space-y-2">
            {DOC_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-ink-800 underline decoration-ink-900/25 decoration-dashed underline-offset-4 transition-colors hover:text-poppy hover:decoration-poppy/50"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Связаться с нами">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Мы на связи</h3>
          <ul className="mt-3 space-y-2">
            <li>
              <a
                href="https://t.me/ogonek_help"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-ink-800 transition-colors hover:text-poppy"
              >
                <TelegramLogo className="h-4 w-4" />
                @ogonek_help
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@ogonek.example"
                className="flex items-center gap-2 text-sm text-ink-800 transition-colors hover:text-poppy"
              >
                <PaperPlaneTilt className="h-4 w-4" />
                hello@ogonek.example
              </a>
            </li>
          </ul>
          <p className="mt-3 text-xs text-ink-500">Отвечаем быстро, часовой пояс МСК</p>
        </nav>
      </div>

      <p className="mt-10 text-center text-[12px] text-ink-500">
        © 2026 {BRAND} · Сделано с теплом для вечерних ритуалов
      </p>
    </footer>
  )
}
