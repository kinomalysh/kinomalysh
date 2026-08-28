import { Link } from 'react-router-dom'
import { PaperPlaneTilt, TelegramLogo } from '@phosphor-icons/react'
import { BRAND, ROUTES } from '@/shared/config/routes'
import { asset } from '@/shared/lib/asset'
import { SEO_PAGES } from '@/entities/seo-page/model'

const DOC_LINKS = [
  { to: ROUTES.terms, label: 'Пользовательское соглашение' },
  { to: ROUTES.privacy, label: 'Политика конфиденциальности' },
]

export function Footer() {
  return (
    <footer className="mt-4 border-t-2 border-dashed border-ink-900/15 pb-28 pt-10 lg:pb-16 lg:pt-16">
      <div className="shell">
      <p className="hand-note text-center text-lg rotate-[-1deg]">
        конец. но сказки только начинаются
      </p>

      <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <img src={asset('logo-wordmark.png')} alt={BRAND} className="h-11 w-auto" />
          <p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-ink-800">
            Персональные сказки, где главную роль играет ваш ребёнок. Мультфильмы и книги с
            озвучкой - за 15 минут
          </p>
        </div>

        <nav aria-label="Что мы делаем" className="sm:col-span-2 lg:col-span-1">
          <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Что мы делаем</h3>
          <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {SEO_PAGES.map((page) => (
              <li key={page.slug}>
                <Link
                  to={`/${page.slug}`}
                  className="text-sm text-ink-800 underline decoration-ink-900/25 decoration-dashed underline-offset-4 transition-colors hover:text-poppy hover:decoration-poppy/50 inline-flex min-h-9 items-center"
                >
                  {page.navLabel}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-8">
          <nav aria-label="Связаться с нами">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Мы на связи</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://t.me/kinomalysh_help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-ink-800 transition-colors hover:text-poppy"
                >
                  <TelegramLogo className="h-4 w-4 shrink-0" />
                  @kinomalysh_help
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@kinomalysh.ru"
                  className="flex items-center gap-2 text-sm text-ink-800 transition-colors hover:text-poppy"
                >
                  <PaperPlaneTilt className="h-4 w-4 shrink-0" />
                  hello@kinomalysh.ru
                </a>
              </li>
            </ul>
            <p className="mt-3 text-xs text-ink-500">Отвечаем быстро, часовой пояс МСК</p>
          </nav>

          <nav aria-label="Документы">
            <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">Документы</h3>
            <ul className="mt-3 space-y-2">
              {DOC_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-ink-800 underline decoration-ink-900/25 decoration-dashed underline-offset-4 transition-colors hover:text-poppy hover:decoration-poppy/50 inline-flex min-h-9 items-center"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-ink-500">
        © 2026 {BRAND} · Сделано с теплом для вечерних ритуалов
      </p>
      </div>
    </footer>
  )
}
