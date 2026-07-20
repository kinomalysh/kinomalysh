import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')
const ssrDir = join(root, 'dist-ssr')

const { render, PAGE_META, siteConfig, INDEXABLE_PATHS } = await import(
  join(ssrDir, 'entry-server.js')
)

const template = readFileSync(join(distDir, 'index.html'), 'utf-8')

function metaFor(path) {
  return PAGE_META.find((page) => page.path === path)
}

function replaceTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html
}

function buildPage(path) {
  const meta = metaFor(path)
  const canonical = `${siteConfig.url}${path === '/' ? '/' : path}`
  const appHtml = render(path)

  let html = template
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${meta.title}</title>`)
  html = replaceTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${meta.description}" />`,
  )
  html = replaceTag(
    html,
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${canonical}" />`,
  )
  html = replaceTag(
    html,
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${meta.title}" />`,
  )
  html = replaceTag(
    html,
    /<meta property="og:url"[^>]*>/,
    `<meta property="og:url" content="${canonical}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${meta.description}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${meta.title}" />`,
  )
  html = replaceTag(
    html,
    /<meta\s+name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${meta.description}" />`,
  )
  return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
}

for (const path of INDEXABLE_PATHS) {
  const html = buildPage(path)
  const outFile = path === '/' ? join(distDir, 'index.html') : join(distDir, path, 'index.html')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, html)
  console.log(`prerendered ${path} → ${(html.length / 1024).toFixed(1)} kB`)
}

rmSync(ssrDir, { recursive: true, force: true })
