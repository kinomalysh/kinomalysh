import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/shared/api'
import { useAuth } from '@/shared/auth'
import { cn } from '@/shared/ui'

const NAV = [
  { to: '/', label: 'Дашборд', end: true },
  { to: '/orders', label: 'Заказы', end: false },
  { to: '/products', label: 'Продукты', end: false },
  { to: '/users', label: 'Пользователи', end: false },
  { to: '/reels', label: 'Генерация роликов', end: false },
]

export function AdminShell() {
  const admin = useAuth((s) => s.admin)
  const signOut = useAuth((s) => s.signOut)
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-full">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-line bg-surface px-4 py-6">
        <div className="px-2">
          <p className="font-display text-2xl text-ink">Киномалыш</p>
          <p className="text-xs uppercase tracking-widest text-gold">Панель управления</p>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-accent text-white' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line pt-4">
          <p className="px-2 text-sm font-medium text-ink">{admin?.name}</p>
          <p className="px-2 text-xs text-ink-3">@{admin?.login}</p>
          <button
            onClick={onLogout}
            className="mt-3 w-full rounded-xl px-3 py-2 text-left text-sm text-ink-3 hover:bg-surface-2 hover:text-berry"
          >
            Выйти
          </button>
        </div>
      </aside>
      <main className="ml-60 min-w-0 flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
