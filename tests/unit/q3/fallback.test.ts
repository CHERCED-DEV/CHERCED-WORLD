import { describe, expect, it, vi } from 'vitest'
import { rfc822Date } from '@/lib/blog/feed'
import { elements, only, parseXml, text } from './support/xml'

vi.mock('@/content/posts/registry', async () => {
  const { post: make } = await import('../q0/support/posts')
  const loader = (meta: ReturnType<typeof make>) => async () => ({ default: () => null, meta })
  return {
    postRegistry: {
      ambos: {
        es: loader(make('ambos', { lang: 'es', date: '2026-03-01', title: 'Sagas y compensación', tags: ['sagas'] })),
        en: loader(make('ambos', { lang: 'en', date: '2026-03-01', title: 'Sagas and compensation', tags: ['sagas'] })),
      },
      'solo-en': {
        en: loader(
          make('solo-en', {
            lang: 'en',
            originalLang: 'en',
            date: '2026-04-01',
            updated: '2026-05-10',
            title: 'Only in English',
            tags: ['english', 'notes'],
          }),
        ),
      },
      viejo: {
        es: loader(make('viejo', { lang: 'es', date: '2023-04-06', tags: ['carrera'] })),
        en: loader(make('viejo', { lang: 'en', date: '2023-04-06', tags: ['career'] })),
      },
    },
  }
})

const { buildFeed } = await import('@/app/[lang]/feed.xml/rss')
const { generateImageMetadata } = await import('@/app/[lang]/blog/[id]/opengraph-image')

const BASE = new URL('https://cherced-world.test')

async function itemIds(lang: 'es' | 'en'): Promise<string[]> {
  const channel = only(parseXml(await buildFeed(lang, BASE)), 'channel')
  return elements(channel, 'item').map((item) => new URL(text(only(item, 'link'))).pathname)
}

describe('un post sin traducción (edge case de la spec)', () => {
  it('sale solo en el feed de su idioma', async () => {
    expect(await itemIds('en')).toEqual(['/en/blog/solo-en', '/en/blog/ambos', '/en/blog/viejo'])
    expect(await itemIds('es')).toEqual(['/es/blog/ambos', '/es/blog/viejo'])
  })

  it('lastBuildDate toma la actualización más reciente del idioma', async () => {
    const date = (xml: string) => text(only(only(parseXml(xml), 'channel'), 'lastBuildDate'))
    expect(date(await buildFeed('en', BASE))).toBe(rfc822Date('2026-05-10'))
    expect(date(await buildFeed('es', BASE))).toBe(rfc822Date('2026-03-01'))
  })

  it('su página en el otro idioma también tiene imagen OG, con el título que de verdad se lee', async () => {
    const [image] = await generateImageMetadata({ params: { lang: 'es', id: 'solo-en' } })
    expect(image?.alt).toBe('Only in English: 1 de abril de 2026 · english · notes')
  })
})
