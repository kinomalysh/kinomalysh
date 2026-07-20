import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { seoPlugin } from './vite-seo-plugin'

export default defineConfig({
  base: process.env.DEPLOY_BASE ?? '/',
  define: {
    __SITE_URL__: JSON.stringify(process.env.VITE_SITE_URL ?? 'https://kinomalysh.ru'),
  },
  plugins: [react(), tailwindcss(), seoPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
