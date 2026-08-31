import { useEffect, useRef } from 'react'

// deps нужны для блоков, где карточки приходят с сервера: наблюдатель вешался
// один раз при монтировании, поэтому содержимое, отрисованное позже, навсегда
// оставалось с opacity 0 - на экране пустое место вместо карточек.
export function useReveal<T extends HTMLElement = HTMLDivElement>(deps: unknown[] = []) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = el.querySelectorAll<HTMLElement>('.reveal')
    if (targets.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    targets.forEach((t) => observer.observe(t))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
