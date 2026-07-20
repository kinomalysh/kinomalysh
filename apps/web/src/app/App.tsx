import { BrowserRouter } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import { Routes } from '@/app/routes'

export function App() {
  return (
    <IconContext.Provider value={{ weight: 'duotone' }}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Routes />
      </BrowserRouter>
    </IconContext.Provider>
  )
}
