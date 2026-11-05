import { describe, expect, it, vi } from 'vitest'
import { escapeXml, FEED_CONTENT_TYPE, feedAlternates, feedPath, feedUrl, rfc822Date, toFeedItems } from '@/lib/blog/feed'
import { post } from './support/posts'

vi.mock('@/content/posts/registry', async () => {
  const { post: make } = await import('./support/posts')
  const loader = (meta: ReturnType<typeof make>) => async () => ({ default: () => null, meta })
  return {
    postRegistry: {
      ambos: {
        es: loader(make('ambos', { lang: 'es', date: '2026-03-01', title: 'Sagas & <compensación>', tags: ['sagas', 'arquitectura'] })),
        en: loader(make('ambos', { lang: 'en', date: '2026-03-01', title: 'Sagas & <compensation>', tags: ['sagas', 'architecture'] })),
      },
      'solo-en': { en: loader(make('solo-en', { lang: 'en', originalLang: 'en', date: '2026-04-01', tags: ['english'] })) },
      viejo: {
        es: loader(make('viejo', { lang: 'es', date: '2023-04-06', tags: ['carrera'] })),
        en: loader(make('viejo', { lang: 'en', date: '2023-04-06', tags: ['career'] })),
      },
    },
  }
})

const { feedItems } = await import('@/lib/blog/source')

const BASE = new URL('https://cherced-world.test')

describe('escape XML (R-501)', () => {
  it('escapa las cinco entidades y no deja etiquetas vivas', () => {
    expect(escapeXml(`Tom & "Jerry" <b>'hola'</b>`)).toBe('Tom &amp; &quot;Jerry&quot; &lt;b&gt;&apos;hola&apos;&lt;/b&gt;')
    expect(escapeXml(']]></description><script>')).not.toMatch(/[<>]/)
  })

  it('quita caracteres que XML 1.0 no admite y conserva tildes, emojis y saltos de línea', () => {
    expect(escapeXml('a\u0000b\u0008c\u000Bd\u001Fe￾f')).toBe('abcdef')
    expect(escapeXml('Diseño 🚀\n\tbien')).toBe('Diseño 🚀\n\tbien')
    expect(escapeXml('suelto \uD800 aquí')).toBe('suelto  aquí')
  })

  it('trata la entrada como texto crudo: un & siempre se escapa', () => {
    expect(escapeXml('&amp;')).toBe('&amp;amp;')
  })
})

describe('fechas RFC 822', () => {
  it('convierte AAAA-MM-DD a la fecha del día en GMT', () => {
    expect(rfc822Date('2026-11-02')).toBe('Mon, 02 Nov 2026 00:00:00 GMT')
    expect(rfc822Date('2023-04-06')).toBe('Thu, 06 Apr 2023 00:00:00 GMT')
  })

  it('rechaza fechas inválidas en vez de publicar una fecha falsa', () => {
    expect(() => rfc822Date('2026-02-30')).toThrow(RangeError)
    expect(() => rfc822Date('2026-13-01')).toThrow(RangeError)
    expect(() => rfc822Date('2026-00-10')).toThrow(RangeError)
    expect(() => rfc822Date('ayer')).toThrow(RangeError)
  })
})

describe('rutas y anuncio del feed (FR-522, FR-523)', () => {
  it('vive en /{lang}/feed.xml y se anuncia como application/rss+xml', () => {
    expect(feedPath('es')).toBe('/es/feed.xml')
    expect(feedUrl('en', BASE)).toBe('https://cherced-world.test/en/feed.xml')
    expect(feedAlternates('es')).toEqual({ 'application/rss+xml': '/es/feed.xml' })
    expect(FEED_CONTENT_TYPE).toBe('application/rss+xml; charset=utf-8')
  })
})

describe('items del feed', () => {
  it('arma título, enlace absoluto, guid permanente, descripción, fecha y etiquetas', () => {
    const [item] = toFeedItems([post('post9', { title: 'T', description: 'D', date: '2026-11-02', tags: ['a', 'b'] })], 'es', BASE)
    expect(item).toEqual({
      title: 'T',
      link: 'https://cherced-world.test/es/blog/post9',
      guid: 'https://cherced-world.test/es/blog/post9',
      description: 'D',
      pubDate: 'Mon, 02 Nov 2026 00:00:00 GMT',
      categories: ['a', 'b'],
    })
  })

  it('solo trae los posts con versión en ese idioma, del más nuevo al más viejo', async () => {
    const es = await feedItems('es', BASE)
    const en = await feedItems('en', BASE)
    expect(es.map((item) => item.link)).toEqual(['https://cherced-world.test/es/blog/ambos', 'https://cherced-world.test/es/blog/viejo'])
    expect(en.map((item) => item.link)).toEqual([
      'https://cherced-world.test/en/blog/solo-en',
      'https://cherced-world.test/en/blog/ambos',
      'https://cherced-world.test/en/blog/viejo',
    ])
    expect(es[0]).toMatchObject({ title: 'Sagas & <compensación>', categories: ['sagas', 'arquitectura'] })
    expect(en[1]?.categories).toEqual(['sagas', 'architecture'])
  })

  it('deja el texto crudo: el escape va al serializar, una sola vez', async () => {
    const [first] = await feedItems('es', BASE)
    expect(first?.title).toContain('&')
    expect(escapeXml(first!.title)).toBe('Sagas &amp; &lt;compensación&gt;')
  })
})
