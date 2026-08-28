import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { ROUTES } from '@/shared/config/routes'
import { Footer } from '@/widgets/footer/Footer'
import { useSeoMeta } from '@/shared/lib/seo'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useSeoMeta({
    title: 'Страница не найдена — Киномалыш',
    description: 'Такой страницы на сайте «Киномалыш» нет. Вернитесь на главную или откройте блог.',
    path: pathname,
    noindex: true,
  })

  return (
    <div className="shell pt-4 lg:pt-10">
      <header className="pt-16 pb-10">
        <p className="hand-note text-xl rotate-[-1deg]">404</p>
        <h1 className="mt-1 font-display text-hero text-ink-900 text-balance">
          Такой страницы нет
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-800">
          Возможно, ссылка устарела или в адресе опечатка. Сказки никуда не делись — они на главной,
          и там же можно загрузить фото и бесплатно посмотреть кастинг героя.
        </p>
        <Button size="lg" className="mt-6 w-full sm:w-auto" onClick={() => navigate(ROUTES.home)}>
          На главную
        </Button>
      </header>

      <section className="border-t-2 border-dashed border-ink-900/15 py-8">
        <h2 className="font-display text-2xl text-ink-900">Куда можно пойти</h2>
        <ul className="mt-4 space-y-2">
          <li>
            <Link
              to={ROUTES.home}
              className="underline decoration-dashed underline-offset-4 hover:text-ember-600"
            >
              Главная — мультфильм по фото ребёнка за 15 минут
            </Link>
          </li>
          <li>
            <Link
              to={ROUTES.create}
              className="underline decoration-dashed underline-offset-4 hover:text-ember-600"
            >
              Создать сказку — загрузить фото
            </Link>
          </li>
          <li>
            <Link
              to="/blog"
              className="underline decoration-dashed underline-offset-4 hover:text-ember-600"
            >
              Блог — о сказках, подарках и нейросетях
            </Link>
          </li>
        </ul>
      </section>

      <Footer />
    </div>
  )
}
