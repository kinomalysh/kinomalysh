import { Route, Routes as RouterRoutes } from 'react-router-dom'
import { ROUTES } from '@/shared/config/routes'
import { AppShell } from '@/widgets/app-shell/AppShell'
import { HomePage } from '@/pages/home/HomePage'
import { PrivacyPage, TermsPage } from '@/pages/legal/LegalPages'
import { CreatePage } from '@/pages/create/CreatePage'
import { LibraryPage } from '@/pages/library/LibraryPage'
import { StoryPage } from '@/pages/story/StoryPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { AuthPage } from '@/pages/auth/AuthPage'
import { PaymentResultPage } from '@/pages/payment/PaymentResultPage'
import { SeoLandingPage } from '@/pages/seo/SeoLandingPage'
import { BlogIndexPage } from '@/pages/blog/BlogIndexPage'
import { BlogPostPage } from '@/pages/blog/BlogPostPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'

export function Routes() {
  return (
    <RouterRoutes>
      <Route element={<AppShell />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.create} element={<CreatePage />} />
        <Route path={ROUTES.library} element={<LibraryPage />} />
        <Route path={ROUTES.storyPattern} element={<StoryPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path={ROUTES.auth} element={<AuthPage />} />
        <Route path={ROUTES.paymentResult} element={<PaymentResultPage />} />
        <Route path={ROUTES.terms} element={<TermsPage />} />
        <Route path={ROUTES.privacy} element={<PrivacyPage />} />
        <Route path="/blog" element={<BlogIndexPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/:slug" element={<SeoLandingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </RouterRoutes>
  )
}
