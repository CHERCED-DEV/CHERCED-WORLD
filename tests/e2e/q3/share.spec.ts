import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type APIRequestContext } from '@playwright/test'
import type { PostMeta } from '@/content/types'
import { formatPostDate } from '@/lib/blog/format'
import { readMeta } from '../../unit/l5/support/mdx-registry'

const ROOT = path.join(__dirname, '..', '..', '..')
const LANGS = ['es', 'en'] as const
const RSS_TYPE = 'application/rss+xml; charset=utf-8'
const SAMPLE = { lang: 'es', id: 'post4' } as const

type Lang = (typeof LANGS)[number]

function ownMetas(lang: Lang): PostMeta[] {
  const dir = path.join(ROOT, 'content', 'posts')
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, `${lang}.mdx`)))
    .map((entry) => readMeta(path.join(dir, entry.name, `${lang}.mdx`)))
}

function pendingUntil(file: string, ready: (source: string) => boolean, owner: string): string | null {
  const full = path.join(ROOT, file)
  if (!existsSync(full)) return `pendiente: ${file} llega con ${owner}; se prueba al integrar`
  return ready(readFileSync(full, 'utf8')) ? null : `pendiente: ${file} lo cambia ${owner}; se prueba al integrar`
}

const POST_PAGE = 'app/[lang]/blog/[id]/page.tsx'

const ANNOUNCED: ReadonlyArray<{ page: (lang: Lang) => string; file: string; owner: string }> = [
  { page: (lang) => `/${lang}/blog`, file: 'app/[lang]/blog/page.tsx', owner: 'Q1 (T616)' },
  { page: (lang) => `/${lang}/blog/tag/${lang === 'es' ? 'arquitectura' : 'architecture'}`, file: 'app/[lang]/blog/tag/[tag]/page.tsx', owner: 'Q1 (T616)' },
  { page: (lang) => `/${lang}/blog/post4`, file: POST_PAGE, owner: 'Q2 (T627)' },
]

function pngSize(png: Buffer): [number, number] {
  expect(png.subarray(1, 4).toString('latin1')).toBe('PNG')
  return [png.readUInt32BE(16), png.readUInt32BE(20)]
}

async function headOf(request: APIRequestContext, url: string): Promise<string> {
  const response = await request.get(url)
  expect(response.status(), url).toBe(200)
  const html = await response.text()
  return html.slice(0, html.indexOf('</head>'))
}

const HTML_ENTITIES: Record<string, string> = { '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>', '&amp;': '&' }

function attr(tag: string, name: string): string | null {
  const raw = new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1]
  return raw === undefined ? null : raw.replace(/&(?:quot|#x27|#39|lt|gt|amp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
}

function metaContent(head: string, property: string): string | null {
  const tag = head.match(new RegExp(`<meta[^>]*property="${property.replace(/:/g, '\\:')}"[^>]*>`))?.[0]
  return tag ? attr(tag, 'content') : null
}

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'lee respuestas del servidor: no depende del dispositivo ni de JS')
})

test.describe('imagen OG de cada post (FR-520, SC-503)', () => {
  for (const lang of LANGS) {
    test(`${lang}: cada post responde un PNG de 1200 × 630 en /${lang}/blog/{id}/opengraph-image/og`, async ({ request }, testInfo) => {
      test.setTimeout(120_000)
      const metas = ownMetas(lang)
      expect(metas.length).toBeGreaterThan(0)
      for (const meta of metas) {
        const url = `/${lang}/blog/${meta.id}/opengraph-image/og`
        const response = await request.get(url)
        expect(response.status(), url).toBe(200)
        expect(response.headers()['content-type'], url).toContain('image/png')
        const png = await response.body()
        expect(pngSize(png), url).toEqual([1200, 630])
        if (lang === SAMPLE.lang && meta.id === SAMPLE.id) {
          await testInfo.attach(`og-${lang}-${meta.id}.png`, { body: png, contentType: 'image/png' })
        }
      }
      expect((await request.get(`/${lang}/blog/no-existe/opengraph-image/og`)).status()).toBe(404)
    })

    test(`${lang}: la página de cada post publica su og:image con alt, tamaño y tipo`, async ({ request }) => {
      const pending = pendingUntil(POST_PAGE, (source) => !/openGraph:[\s\S]*images:/.test(source), 'Q2 (T627): quitar openGraph.images')
      test.skip(Boolean(pending), pending ?? '')
      for (const meta of ownMetas(lang)) {
        const head = await headOf(request, `/${lang}/blog/${meta.id}`)
        const image = metaContent(head, 'og:image')
        expect(image, meta.id).not.toBeNull()
        expect(new URL(image ?? '').pathname, meta.id).toBe(`/${lang}/blog/${meta.id}/opengraph-image/og`)
        expect(metaContent(head, 'og:image:width'), meta.id).toBe('1200')
        expect(metaContent(head, 'og:image:height'), meta.id).toBe('630')
        expect(metaContent(head, 'og:image:type'), meta.id).toBe('image/png')
        expect(metaContent(head, 'og:image:alt'), meta.id).toBe(`${meta.title}: ${[formatPostDate(meta.date, lang), ...meta.tags].join(' · ')}`)
      }
    })
  }
})

test.describe('feed RSS por idioma (FR-522, SC-504)', () => {
  for (const lang of LANGS) {
    test(`/${lang}/feed.xml es RSS 2.0 bien formado, con URLs absolutas y fechas de la meta`, async ({ request, page }) => {
      const response = await request.get(`/${lang}/feed.xml`)
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toBe(RSS_TYPE)
      const xml = await response.text()
      await page.goto('about:blank')
      const feed = await page.evaluate((source) => {
        const doc = new DOMParser().parseFromString(source, 'application/xml')
        const read = (node: Element | null, name: string) => node?.getElementsByTagName(name)[0]?.textContent ?? null
        const channel = doc.documentElement.getElementsByTagName('channel')[0] ?? null
        const self = doc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')[0]
        return {
          error: doc.getElementsByTagName('parsererror')[0]?.textContent ?? null,
          root: doc.documentElement.nodeName,
          version: doc.documentElement.getAttribute('version'),
          link: read(channel, 'link'),
          language: read(channel, 'language'),
          self: self ? { href: self.getAttribute('href'), rel: self.getAttribute('rel'), type: self.getAttribute('type') } : null,
          items: [...doc.getElementsByTagName('item')].map((item) => ({
            title: read(item, 'title'),
            link: read(item, 'link'),
            guid: read(item, 'guid'),
            permaLink: item.getElementsByTagName('guid')[0]?.getAttribute('isPermaLink') ?? null,
            pubDate: read(item, 'pubDate'),
            categories: [...item.getElementsByTagName('category')].map((category) => category.textContent),
          })),
        }
      }, xml)

      expect(feed.error).toBeNull()
      expect([feed.root, feed.version, feed.language]).toEqual(['rss', '2.0', lang])
      expect(new URL(feed.link ?? '').pathname).toBe(`/${lang}/blog`)
      expect(feed.self?.rel).toBe('self')
      expect(feed.self?.type).toBe('application/rss+xml')
      expect(new URL(feed.self?.href ?? '').pathname).toBe(`/${lang}/feed.xml`)

      const metas = ownMetas(lang).sort((a, b) => b.date.localeCompare(a.date))
      expect(feed.items).toHaveLength(metas.length)
      for (const [index, item] of feed.items.entries()) {
        const meta = metas.find((candidate) => new URL(item.link ?? '').pathname === `/${lang}/blog/${candidate.id}`)
        expect(meta, item.link ?? `item ${index}`).toBeDefined()
        if (!meta) continue
        const link = new URL(item.link ?? '')
        expect(link.protocol).toMatch(/^https?:$/)
        expect(link.origin).toBe(new URL(feed.self?.href ?? '').origin)
        expect(item.guid).toBe(item.link)
        expect(item.permaLink).toBe('true')
        expect(item.title).toBe(meta.title)
        expect(new Date(item.pubDate ?? '').toISOString().slice(0, 10)).toBe(meta.date)
        expect(item.categories).toEqual(meta.tags)
        expect(meta.date <= (metas[index - 1]?.date ?? meta.date)).toBe(true)
      }
    })
  }

  test('un idioma que no existe no tiene feed', async ({ request }) => {
    expect((await request.get('/fr/feed.xml')).status()).toBe(404)
  })
})

test.describe('cada página del blog anuncia su feed en el <head> (FR-523)', () => {
  for (const { page, file, owner } of ANNOUNCED) {
    for (const lang of LANGS) {
      test(`${page(lang)} enlaza /${lang}/feed.xml con rel="alternate"`, async ({ request }) => {
        const pending = pendingUntil(file, (source) => source.includes('feedAlternates'), owner)
        test.skip(Boolean(pending), pending ?? '')
        const head = await headOf(request, page(lang))
        const links = head.match(/<link[^>]*type="application\/rss\+xml"[^>]*>/g) ?? []
        expect(links, page(lang)).toHaveLength(1)
        const [link = ''] = links
        expect(attr(link, 'rel')).toBe('alternate')
        const href = new URL(attr(link, 'href') ?? '', 'http://localhost')
        expect(href.pathname).toBe(`/${lang}/feed.xml`)
        const feed = await request.get(href.pathname)
        expect(feed.status()).toBe(200)
        expect(feed.headers()['content-type']).toBe(RSS_TYPE)
      })
    }
  }
})
