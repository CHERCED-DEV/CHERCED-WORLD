import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { now } from '@/content/now'
import { site } from '@/content/site'
import { synergosShowcase } from '@/content/synergos-showcase'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { default: sitemap } = await import('@/app/sitemap')
const { default: robots } = await import('@/app/robots')

const ROOT = path.resolve(__dirname, '..', '..', '..')
const APP = path.join(ROOT, 'app', '[lang]')

const entries = await sitemap()
const paths = entries.map((entry) => new URL(entry.url).pathname)

const CONDITIONAL_NOINDEX: Record<string, string> = {
  '/blog/tag/[tag]': 'solo es noindex en el idioma donde la etiqueta no tiene posts; el sitemap lista solo los idiomas con posts (q0/sitemap)',
}

function noindexRoutes(dir: string, route = ''): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return noindexRoutes(full, /^\(.*\)$/.test(name) ? route : `${route}/${name}`)
    if (!/^(page|layout)\.tsx$/.test(name)) return []
    return /index:\s*false/.test(readFileSync(full, 'utf8')) ? [route || '/'] : []
  })
}

describe('sitemap sin páginas noindex (FR-830, SC-803)', () => {
  it('las rutas marcadas noindex en el código no aparecen en el sitemap', () => {
    const routes = [...new Set(noindexRoutes(APP))]
    expect(routes.sort()).toEqual(['/account', '/blog/catalog', '/blog/tag/[tag]', '/inbox'].sort())
    for (const route of routes.filter((item) => !(item in CONDITIONAL_NOINDEX))) {
      for (const lang of ['es', 'en']) {
        expect(paths.filter((item) => item === `/${lang}${route}` || item.startsWith(`/${lang}${route}/`)), route).toEqual([])
      }
    }
  })

  it('no lista la API, el feed, el 404 ni rutas repetidas', () => {
    expect(paths.filter((item) => /^\/api\/|feed\.xml|not-found|\/inbox/.test(item))).toEqual([])
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths.every((item) => /^\/(es|en)(\/|$)/.test(item))).toBe(true)
  })

  it('cada entrada declara es, en y x-default', () => {
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {}).sort(), entry.url).toEqual(['en', 'es', 'x-default'])
    }
  })

  it('fecha de actualización real donde el contenido la tiene', () => {
    const lastModified = (pathname: string) => entries.find((entry) => new URL(entry.url).pathname === pathname)?.lastModified
    for (const lang of ['es', 'en']) {
      expect(lastModified(`/${lang}/now`)).toBe(now.updatedAt)
      expect(lastModified(`/${lang}/privacy`)).toBe(site.privacy.updatedAt)
      expect(lastModified(`/${lang}/synergos`)).toBe(synergosShowcase.countedAt)
      expect(lastModified(`/${lang}/services`)).toBeUndefined()
    }
  })
})

describe('robots.txt (FR-831)', () => {
  it('deja rastrear todo salvo la API y apunta al sitemap absoluto', () => {
    const data = robots()
    expect(data.rules).toEqual([{ userAgent: '*', allow: '/', disallow: '/api/' }])
    expect(data.sitemap).toMatch(/^https?:\/\/[^/]+\/sitemap\.xml$/)
  })
})
