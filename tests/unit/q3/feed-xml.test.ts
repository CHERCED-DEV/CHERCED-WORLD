import { describe, expect, it, vi } from 'vitest'
import { FEED_CONTENT_TYPE, rfc822Date } from '@/lib/blog/feed'
import { locales, type Locale } from '@/lib/i18n'
import { elements, only, parseXml, text, textNodes, XmlError, type XmlElement } from './support/xml'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { ATOM_NS, buildFeed, renderRss } = await import('@/app/[lang]/feed.xml/rss')
const route = await import('@/app/[lang]/feed.xml/route')
const { ownPosts } = await import('@/lib/blog/source')

const BASE = new URL('https://cherced-world.test')

const COPY = {
  es: {
    title: 'Blog | <-CHERCED-WORLD->',
    description: 'Notas de un arquitecto que trabaja con agentes: decisiones, errores y lo que los tests no vieron.',
  },
  en: {
    title: 'Blog | <-CHERCED-WORLD->',
    description: "Notes from an architect who works with agents: decisions, mistakes and what the tests didn't catch.",
  },
} as const

const ITEM_FIELDS = new Set(['title', 'link', 'guid', 'description', 'pubDate', 'category'])

async function feed(lang: Locale): Promise<{ rss: XmlElement; channel: XmlElement }> {
  const rss = parseXml(await buildFeed(lang, BASE))
  return { rss, channel: only(rss, 'channel') }
}

function newestFirst<T extends { date: string }>(posts: readonly T[]): T[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date))
}

describe('feed RSS 2.0 por idioma (FR-522, R-501)', () => {
  it.each(locales)('%s: el XML parsea y declara RSS 2.0, su canal y atom:link rel="self" absoluto', async (lang) => {
    const { rss, channel } = await feed(lang)
    expect(rss.name).toBe('rss')
    expect(rss.attrs).toEqual({ version: '2.0', 'xmlns:atom': ATOM_NS })
    expect(ATOM_NS).toBe('http://www.w3.org/2005/Atom')
    expect(elements(rss).map((node) => node.name)).toEqual(['channel'])
    expect(text(only(channel, 'title'))).toBe(COPY[lang].title)
    expect(text(only(channel, 'link'))).toBe(`https://cherced-world.test/${lang}/blog`)
    expect(text(only(channel, 'description'))).toBe(COPY[lang].description)
    expect(text(only(channel, 'language'))).toBe(lang)
    expect(only(channel, 'atom:link').attrs).toEqual({
      href: `https://cherced-world.test/${lang}/feed.xml`,
      rel: 'self',
      type: 'application/rss+xml',
    })
  })

  it.each(locales)('%s: lastBuildDate es la fecha más reciente de sus posts, no la hora del build', async (lang) => {
    const { channel } = await feed(lang)
    const newest = (await ownPosts(lang)).map((post) => post.updated ?? post.date).sort().at(-1) ?? ''
    expect(text(only(channel, 'lastBuildDate'))).toBe(rfc822Date(newest))
    expect(await buildFeed(lang, BASE)).toBe(await buildFeed(lang, BASE))
  })

  it.each(locales)('%s: un item por post con versión en el idioma, del más nuevo al más viejo', async (lang) => {
    const { channel } = await feed(lang)
    const posts = newestFirst(await ownPosts(lang))
    const items = elements(channel, 'item')
    expect(posts.length).toBeGreaterThan(0)
    expect(items.map((item) => text(only(item, 'link')))).toEqual(posts.map((post) => `https://cherced-world.test/${lang}/blog/${post.id}`))
  })

  it.each(locales)('%s: cada item trae título, enlace absoluto, guid permanente, descripción, fecha RFC 822 y etiquetas', async (lang) => {
    const { channel } = await feed(lang)
    const posts = newestFirst(await ownPosts(lang))
    elements(channel, 'item').forEach((item, index) => {
      const meta = posts[index]
      if (!meta) throw new Error(`item ${index} sin post`)
      const link = `https://cherced-world.test/${lang}/blog/${meta.id}`
      expect(elements(item).map((node) => node.name)).toEqual(['title', 'link', 'guid', 'description', 'pubDate', ...meta.tags.map(() => 'category')])
      expect(text(only(item, 'title'))).toBe(meta.title)
      expect(new URL(text(only(item, 'link'))).toString()).toBe(link)
      expect(only(item, 'guid').attrs).toEqual({ isPermaLink: 'true' })
      expect(text(only(item, 'guid'))).toBe(link)
      expect(text(only(item, 'description'))).toBe(meta.description)
      const pubDate = text(only(item, 'pubDate'))
      expect(pubDate).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} 00:00:00 GMT$/)
      expect(new Date(pubDate).toISOString().slice(0, 10)).toBe(meta.date)
      expect(elements(item, 'category').map(text)).toEqual(meta.tags)
    })
  })

  it.each(locales)('%s: no lleva datos fuera de la meta: ni cuerpo, ni autor, ni correo (SC-504)', async (lang) => {
    const xml = await buildFeed(lang, BASE)
    const { channel } = await feed(lang)
    const posts = await ownPosts(lang)
    const allowed = new Set<string>([
      COPY[lang].title,
      COPY[lang].description,
      lang,
      `https://cherced-world.test/${lang}/blog`,
      rfc822Date(posts.map((post) => post.updated ?? post.date).sort().at(-1) ?? ''),
      ...posts.flatMap((post) => [
        post.title,
        post.description,
        `https://cherced-world.test/${lang}/blog/${post.id}`,
        rfc822Date(post.date),
        ...post.tags,
      ]),
    ])
    expect(textNodes(channel).filter((value) => !allowed.has(value))).toEqual([])
    for (const item of elements(channel, 'item')) {
      expect(elements(item).filter((node) => !ITEM_FIELDS.has(node.name))).toEqual([])
    }
    expect(xml).not.toMatch(/mailto:|@[a-z0-9-]+\.[a-z]{2,}|<author|<content:|<dc:creator|CDATA/i)
  })
})

describe('escape del feed (R-501)', () => {
  it('escapa una sola vez lo que viene de la meta y el XML sigue parseando', () => {
    const channel = {
      title: 'Tom & "Jerry" <-CHERCED-WORLD->',
      link: 'https://x.test/es/blog?a=1&b=2',
      description: "]]></description><script>alert('x')</script>",
      language: 'es',
      self: 'https://x.test/es/feed.xml?x=1&y="2"',
      lastBuildDate: null,
    } as const
    const item = {
      title: '<i>Sagas</i> & compensación',
      link: 'https://x.test/es/blog/a?b=1&c=2',
      guid: 'https://x.test/es/blog/a?b=1&c=2',
      description: 'a\u0000b\u0008c &amp; d',
      pubDate: rfc822Date('2026-11-02'),
      categories: ['C# & .NET', "it's"],
    }
    const xml = renderRss(channel, [item])
    expect(xml).not.toMatch(/<script|<i>|]]>/)
    const parsed = only(parseXml(xml), 'channel')
    expect(text(only(parsed, 'title'))).toBe(channel.title)
    expect(text(only(parsed, 'link'))).toBe(channel.link)
    expect(text(only(parsed, 'description'))).toBe(channel.description)
    expect(only(parsed, 'atom:link').attrs.href).toBe(channel.self)
    expect(elements(parsed, 'lastBuildDate')).toEqual([])
    const [parsedItem] = elements(parsed, 'item')
    if (!parsedItem) throw new Error('sin item')
    expect(text(only(parsedItem, 'title'))).toBe(item.title)
    expect(text(only(parsedItem, 'link'))).toBe(item.link)
    expect(text(only(parsedItem, 'description'))).toBe('abc &amp; d')
    expect(elements(parsedItem, 'category').map(text)).toEqual(item.categories)
  })

  it('un canal sin posts sigue siendo RSS válido, sin items ni lastBuildDate', () => {
    const xml = renderRss(
      { title: 'Blog', link: 'https://x.test/en/blog', description: 'D', language: 'en', self: 'https://x.test/en/feed.xml', lastBuildDate: null },
      [],
    )
    const channel = only(parseXml(xml), 'channel')
    expect(elements(channel).map((node) => node.name)).toEqual(['title', 'link', 'description', 'language', 'atom:link'])
  })
})

describe('route handler del feed (R-501)', () => {
  it('es estático y solo existe para es y en', () => {
    expect(route.dynamic).toBe('force-static')
    expect(route.dynamicParams).toBe(false)
    expect(route.generateStaticParams()).toEqual([{ lang: 'es' }, { lang: 'en' }])
  })

  it.each(locales)('/%s/feed.xml responde 200 con application/rss+xml; charset=utf-8 y el feed del idioma', async (lang) => {
    const response = await route.GET(new Request(`http://localhost/${lang}/feed.xml`), { params: Promise.resolve({ lang }) })
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe(FEED_CONTENT_TYPE)
    const body = await response.text()
    expect(body).toBe(await buildFeed(lang))
    expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true)
    expect(() => parseXml(body)).not.toThrow()
  })

  it('un idioma que no existe responde 404', async () => {
    const response = await route.GET(new Request('http://localhost/fr/feed.xml'), { params: Promise.resolve({ lang: 'fr' }) })
    expect(response.status).toBe(404)
  })
})

describe('el validador XML de la prueba no es de cartón', () => {
  it.each([
    ['una etiqueta sin cerrar', '<rss><channel></rss>'],
    ['un & suelto', '<rss>a & b</rss>'],
    ['una entidad desconocida', '<rss>&nbsp;</rss>'],
    ['un prefijo sin declarar', '<rss><atom:link href="x"/></rss>'],
    ['dos raíces', '<a/><b/>'],
    ['un atributo sin comillas', '<rss version=2.0/>'],
    ['un atributo repetido', '<rss a="1" a="2"/>'],
    ['un < dentro de un atributo', '<rss a="<"/>'],
    ['un carácter de control', '<rss>\u0001</rss>'],
    ['"]]>" en el texto', '<rss>x]]>y</rss>'],
    ['una declaración rota', '<?xml version=1.0?><rss/>'],
  ])('rechaza %s', (_case, xml) => {
    expect(() => parseXml(xml)).toThrow(XmlError)
  })

  it('acepta XML con declaración, espacios de nombres, entidades numéricas y CDATA', () => {
    const root = parseXml('<?xml version="1.0" encoding="UTF-8"?>\n<a xmlns:b="u"><b:c d=\'1\'>&amp;&#233;&#x1F680;</b:c><![CDATA[<x>]]></a>\n')
    expect(text(only(root, 'b:c'))).toBe('&é🚀')
    expect(text(root)).toBe('&é🚀<x>')
  })
})
