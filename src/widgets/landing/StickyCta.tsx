import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { ROUTES } from '@/shared/config/routes'

const SHOW_AFTER_PX = 550

export function StickyCta() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-[5.5rem] z-20 mx-auto hidden w-full max-w-lg px-4 transition-all duration-300 sm:block md:max-w-2xl ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <div className="paper-strong flex items-center gap-3 rounded-3xl p-2.5 pl-4">
        <p className="hidden min-w-0 flex-1 text-xs leading-snug text-ink-800 sm:block">
          Кастинг героя бесплатный — займёт пару минут
        </p>
        <Button className="w-full sm:w-auto" onClick={() => navigate(ROUTES.create)}>
          Загрузить фото — бесплатно
        </Button>
      </div>
    </div>
  )
}
