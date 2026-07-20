import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Books, Moon, Sparkle, User, MagicWand } from '@phosphor-icons/react'
import { cn } from '@/shared/lib/cn'
import { BRAND, ROUTES } from '@/shared/config/routes'
import { Fireflies } from '@/shared/ui/Fireflies'
import { JsonLd } from '@/shared/ui/JsonLd'
import { buildOrganizationLd, buildWebsiteLd } from '@/shared/lib/seo'
import { asset } from '@/shared/lib/asset'

const TABS = [
  { to: ROUTES.home, label: 'Сказки', icon: Moon, end: true },
  { to: ROUTES.create, label: 'Создать', icon: MagicWand, end: false },
  { to: ROUTES.library, label: 'Полка', icon: Books, end: false },
  { to: ROUTES.profile, label: 'Профиль', icon: User, end: false },
]

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isLanding = pathname === ROUTES.home

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 md:max-w-2xl">
      <JsonLd data={buildOrganizationLd()} />
      <JsonLd data={buildWebsiteLd()} />
      <Fireflies />
      <header className="sticky top-0 z-30 -mx-4 mb-2 border-b-2 border-dashed border-ink-900/15 bg-paper/95 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4">
          <NavLink to={ROUTES.home} className="group flex shrink-0 items-center gap-2.5">
            <img
              src={asset('logo.svg')}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rotate-[-4deg] rounded-xl border-2 border-ink-900 shadow-[2px_3px_0_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:rotate-0"
            />
            <span className="flex flex-col">
              <span className="font-display text-xl leading-none text-ink-900">{BRAND}</span>
              <span className="hand-note mt-0.5 text-[13px] leading-none rotate-[-1deg]">
                сказки на ночь
              </span>
            </span>
          </NavLink>

          {isLanding && (
            <nav aria-label="Разделы страницы" className="hidden items-center gap-6 md:flex">
              {[
                { href: '#showcase', label: 'Сюжеты' },
                { href: '#how-heading', label: 'Как работает' },
                { href: '#pricing-heading', label: 'Цены' },
                { href: '#faq-heading', label: 'Вопросы' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group relative whitespace-nowrap pb-1 text-sm font-semibold text-ink-800 transition-colors duration-200 hover:text-ink-900"
                >
                  {link.label}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 rounded-full bg-mustard transition-transform duration-300 ease-out group-hover:scale-x-100"
                  />
                </a>
              ))}
            </nav>
          )}

          <button
            type="button"
            onClick={() => navigate(ROUTES.create)}
            className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-ink-900 bg-poppy px-4 py-2 text-sm font-bold text-on-poppy shadow-[2px_3px_0_rgba(0,0,0,0.45)] transition-all duration-150 hover:bg-poppy-deep active:translate-y-0.5 active:shadow-[1px_1px_0_rgba(0,0,0,0.45)] sm:inline-flex"
          >
            <Sparkle weight="fill" className="h-4 w-4" />
            Создать сказку
          </button>
        </div>
      </header>

      <main className="flex-1 pb-28">
        <Outlet />
      </main>

      <nav
          aria-label="Основная навигация"
          className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:max-w-2xl"
        >
          <div className="paper-strong flex items-end justify-between rounded-3xl px-2 pb-1.5 pt-1.5">
            {TABS.map((tab) => {
              const isCreate = tab.to === ROUTES.create
              if (isCreate) {
                return (
                  <NavLink
                    key={tab.to}
                    to={tab.to}
                    end={tab.end}
                    className="relative -mt-9 flex min-w-16 flex-1 cursor-pointer flex-col items-center gap-0.5 pb-1"
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            'flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink-900 bg-poppy text-on-poppy shadow-[0_4px_0_rgba(0,0,0,0.5)] transition-all duration-200',
                            isActive
                              ? 'rotate-[-10deg] scale-105 shadow-[0_2px_0_rgba(0,0,0,0.5)]'
                              : 'hover:-translate-y-1 active:translate-y-0',
                          )}
                        >
                          <MagicWand weight="fill" className="h-6 w-6" />
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-bold',
                            isActive ? 'text-ink-900' : 'text-ink-500',
                          )}
                        >
                          {tab.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                )
              }
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-w-16 flex-1 flex-col items-center gap-1 rounded-2xl border-2 py-2 text-[11px] font-semibold transition-all duration-200',
                      isActive
                        ? 'rotate-[-2deg] border-ink-900 bg-mustard text-night-950 shadow-[2px_3px_0_rgba(0,0,0,0.4)]'
                        : 'border-transparent text-ink-500 hover:text-ink-900',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <tab.icon
                        weight={isActive ? 'fill' : 'duotone'}
                        className={cn(
                          'h-5 w-5 transition-transform duration-300',
                          isActive && 'scale-110 -rotate-6',
                        )}
                      />
                      {tab.label}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </nav>
    </div>
  )
}
