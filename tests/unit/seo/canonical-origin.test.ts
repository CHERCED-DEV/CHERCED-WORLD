import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { projects } from '@/content/projects'
import { OG_DOMAIN } from '@/lib/og/template'
import { absoluteUrl, getSiteUrl, SITE_HOST, SITE_ORIGIN } from '@/lib/site-url'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const ROOT = path.resolve(__dirname, '..', '..', '..')
const SOURCES = ['app', 'components', 'content', 'lib', 'proxy.ts', 'next.config.ts']
const DOMAIN = /cherced-world\.vercel\.app/

const HISTORICAL: Record<string, string> = {
  'components/experience/capsule-shots.ts': 'la cápsula 2023 se capturó en ese origen y debe seguir diciéndolo',
}

function files(entry: string): string[] {
  const full = path.join(ROOT, entry)
  const stats = statSync(full, { throwIfNoEntry: false })
  if (!stats) return []
  if (stats.isFile()) return /\.(ts|tsx|mdx|json)$/.test(full) ? [entry.replace(/\\/g, '/')] : []
  return readdirSync(full).flatMap((child) => files(path.join(entry, child)))
}

const PRODUCTION = { VERCEL: '1', VERCEL_ENV: 'production', VERCEL_URL_CORS: 'https://otro-origen.example', VERCEL_PROJECT_PRODUCTION_URL: 'otro.vercel.app' }

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('origen canónico en un solo sitio (FR-801, SC-801)', () => {
  it('SITE_ORIGIN es un origen https sin ruta ni barra final', () => {
    const url = new URL(SITE_ORIGIN)
    expect(url.protocol).toBe('https:')
    expect(url.origin).toBe(SITE_ORIGIN)
    expect(SITE_HOST).toBe(url.host)
  })

  it('en producción manda la constante, aunque las variables apunten a otro lado', () => {
    expect(getSiteUrl(PRODUCTION).origin).toBe(SITE_ORIGIN)
    expect(absoluteUrl('/es/blog', PRODUCTION)).toBe(`${SITE_ORIGIN}/es/blog`)
  })

  it('en vista previa y en local sigue el comportamiento de antes', () => {
    expect(getSiteUrl({ VERCEL_ENV: 'preview', VERCEL_URL_CORS: 'https://preview.example' }).origin).toBe('https://preview.example')
    expect(getSiteUrl({}).origin).toBe('http://localhost:3000')
  })

  it('ningún archivo del sitio escribe el dominio a mano, salvo la constante y la cápsula histórica', () => {
    const sources = SOURCES.flatMap(files).map((file) => ({ file, text: readFileSync(path.join(ROOT, file), 'utf8') }))
    expect(sources.filter(({ text }) => text.includes(SITE_HOST)).map(({ file }) => file).filter((file) => !(file in HISTORICAL))).toEqual(['lib/site-url.ts'])
    const vercelApp = sources.filter(({ text }) => DOMAIN.test(text)).map(({ file }) => file)
    expect(vercelApp.filter((file) => file !== 'lib/site-url.ts' && !(file in HISTORICAL))).toEqual([])
  })

  it('la imagen OG y el caso de este sitio leen la constante', () => {
    expect(OG_DOMAIN).toBe(SITE_HOST)
    expect(projects.find((project) => project.id === '2')?.links.live).toBe(`${SITE_ORIGIN}/`)
  })

  it('en producción, robots, sitemap, JSON-LD, RSS y llms.txt salen con el mismo origen', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('VERCEL_URL_CORS', 'https://otro-origen.example')
    const [{ default: robots }, { default: sitemap }, { personJsonLd }, { websiteJsonLd }, { buildFeed }, { buildLlmsTxt }] = await Promise.all([
      import('@/app/robots'),
      import('@/app/sitemap'),
      import('@/lib/seo/person'),
      import('@/lib/seo/website'),
      import('@/app/[lang]/feed.xml/rss'),
      import('@/lib/agent/llms'),
    ])
    expect(robots().sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`)
    const entries = await sitemap()
    expect(entries.length).toBeGreaterThan(50)
    for (const entry of entries) {
      expect(new URL(entry.url).origin, entry.url).toBe(SITE_ORIGIN)
      for (const href of Object.values(entry.alternates?.languages ?? {})) expect(new URL(String(href)).origin).toBe(SITE_ORIGIN)
    }
    expect(personJsonLd('es')['@id']).toBe(`${SITE_ORIGIN}/#person`)
    expect(websiteJsonLd('en').url).toBe(`${SITE_ORIGIN}/`)
    const origins = (text: string) => new Set([...text.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)].map(([href]) => new URL(href).origin))
    const feed = await buildFeed('es')
    expect(feed).toContain(`${SITE_ORIGIN}/es/blog/post4`)
    expect([...origins(feed)].filter((origin) => origin.includes('cherced') || origin.includes('otro-origen'))).toEqual([SITE_ORIGIN])
    const llms = await buildLlmsTxt()
    expect(llms).toContain(`${SITE_ORIGIN}/en/aboutMe`)
    expect(llms).not.toContain('otro-origen')
  }, 60_000)
})
