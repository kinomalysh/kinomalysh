import { useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Books, Moon, Sparkle, User, MagicWand } from '@phosphor-icons/react'
import { cn } from '@/shared/lib/cn'
import { BRAND, ROUTES } from '@/shared/config/routes'
import { Fireflies } from '@/shared/ui/Fireflies'
import { JsonLd } from '@/shared/ui/JsonLd'
import { buildOrganizationLd, buildWebsiteLd } from '@/shared/lib/seo'
import { asset } from '@/shared/lib/asset'
import { useSession } from '@/entities/session/model'
import { formatTokens } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'

const TABS = [
  { to: ROUTES.home, label: 'Сказки', icon: Moon, end: true },
  { to: ROUTES.create, label: 'Создать', icon: MagicWand, end: false },
  { to: ROUTES.library, label: 'Полка', icon: Books, end: false },
  { to: ROUTES.profile, label: 'Профиль', icon: User, end: false },
]

const LANDING_LINKS = [
  { href: '#showcase', label: 'Сюжеты' },
  { href: '#how-heading', label: 'Как работает' },
  { href: '#pricing-heading', label: 'Цены' },
  { href: '#faq-heading', label: 'Вопросы' },
]

const DESK_LINKS = [
  { to: ROUTES.create, label: 'Мультфильмы' },
  { to: ROUTES.library, label: 'Полка' },
]

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isLanding = pathname === ROUTES.home
  const bootstrap = useSession((s) => s.bootstrap)
  const user = useSession((s) => s.user)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <div className="relative flex min-h-dvh flex-col">
      <JsonLd data={buildOrganizationLd()} />
      <JsonLd data={buildWebsiteLd()} />
      <Fireflies />

      <header className="chrome-surface sticky top-0 z-30 border-b-2 border-dashed border-ink-900/15">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 lg:px-8">
          <NavLink to={ROUTES.home} aria-label={BRAND} className="group flex shrink-0 items-center">
            <img
              src={asset('logo-wordmark.png')}
              alt={BRAND}
              className="h-11 w-auto transition-transform duration-300 group-hover:scale-[1.03] sm:h-14"
            />
          </NavLink>

          <nav aria-label="Разделы" className="hidden flex-1 items-center gap-7 lg:flex">
            {(isLanding ? LANDING_LINKS : DESK_LINKS).map((link) =>
              'href' in link ? (
                <a key={link.href} href={link.href} className="nav-link">
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => cn('nav-link', isActive && 'is-active')}
                >
                  {link.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <NavLink
                to={ROUTES.profile}
                className="paper hidden min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink-900 transition-transform duration-150 hover:-translate-y-0.5 lg:inline-flex"
              >
                <Sparkle weight="fill" className="h-4 w-4 text-mustard" />
                {formatTokens(user.balance)}
              </NavLink>
            ) : (
              <NavLink
                to={ROUTES.auth}
                className="hidden min-h-11 items-center px-2 text-sm font-semibold text-ink-800 transition-colors hover:text-ink-900 lg:inline-flex"
              >
                Войти
              </NavLink>
            )}

            <Button
              size="sm"
              className="hidden shrink-0 sm:inline-flex"
              onClick={() => navigate(ROUTES.create)}
            >
              <Sparkle weight="fill" className="h-4 w-4" />
              Создать сказку
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-28 lg:pb-16">
        <Outlet />
      </main>

      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-lg px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] lg:hidden"
      >
        <div className="paper-strong flex items-end justify-between rounded-3xl px-2 pb-1.5 pt-1.5">
          {TABS.map((tab) => {
            if (tab.to === ROUTES.create) {
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
                          'text-xs font-bold',
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
                    'flex min-w-16 flex-1 flex-col items-center gap-1 rounded-2xl border-2 py-2 text-xs font-semibold transition-all duration-200',
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
