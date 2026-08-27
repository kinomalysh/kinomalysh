import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import { Routes } from '@/app/routes'

export { PAGE_META, siteConfig, INDEXABLE_PATHS, PRERENDER_PATHS } from '@/shared/config/site'

export function render(url: string): string {
  return renderToString(
    <IconContext.Provider value={{ weight: 'duotone' }}>
      <StaticRouter location={url}>
        <Routes />
      </StaticRouter>
    </IconContext.Provider>,
  )
}
