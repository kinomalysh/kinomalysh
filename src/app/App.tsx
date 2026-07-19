import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import { ROUTES } from '@/shared/config/routes'
import { AppShell } from '@/widgets/app-shell/AppShell'
import { HomePage } from '@/pages/home/HomePage'
import { PrivacyPage, TermsPage } from '@/pages/legal/LegalPages'
import { CreatePage } from '@/pages/create/CreatePage'
import { LibraryPage } from '@/pages/library/LibraryPage'
import { StoryPage } from '@/pages/story/StoryPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'

export function App() {
  return (
    <IconContext.Provider value={{ weight: 'duotone' }}>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.create} element={<CreatePage />} />
          <Route path={ROUTES.library} element={<LibraryPage />} />
          <Route path={ROUTES.storyPattern} element={<StoryPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />
          <Route path={ROUTES.terms} element={<TermsPage />} />
          <Route path={ROUTES.privacy} element={<PrivacyPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </IconContext.Provider>
  )
}
