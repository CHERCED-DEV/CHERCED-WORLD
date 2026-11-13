import { createElement, Fragment, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AuthorBox } from '@/components/blog/post/AuthorBox'
import type { GeneratedCoverProps } from '@/components/blog/post/cover'
import { RelatedPosts } from '@/components/blog/post/RelatedPosts'
import { seriesNavData } from '@/components/blog/post/series'
import { SeriesNav } from '@/components/blog/post/SeriesNav'
import { splitTemplate } from '@/components/blog/post/template'
import { tocButtonShown, tocChapter } from '@/components/blog/post/TocSheet'
import { translatedFrom, TranslatedNote } from '@/components/blog/post/TranslatedNote'
import { PostView, UpdatedDate } from '@/components/blog/PostView'
import type { PostSeries } from '@/content/posts/series'
import { adjacentPosts } from '@/lib/blog/order'
import { relatedPosts } from '@/lib/blog/related'
import { getDictionary } from '@/lib/i18n/server'
import { post } from '../q0/support/posts'

function h(type: unknown, props: Record<string, unknown> | null, ...children: unknown[]): ReactElement {
  return createElement(type as never, props as never, ...(children as ReactNode[]))
}

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { blogPosts } = await import('@/lib/blog/source')

const render = (node: ReactNode) => renderToStaticMarkup(h(Fragment, null, node))

const es = await getDictionary('es', 'blog')
const en = await getDictionary('en', 'blog')

const prepared = { body: h('p', null, 'Cuerpo del post.'), headings: [], minutes: 1, words: 3 }

describe('nota de traducción (T625, FR-515)', () => {
  it('sale solo cuando el post es una traducción, no un fallback ni el original', () => {
    expect(translatedFrom({ lang: 'es', originalLang: 'en' }, false)).toBe('en')
    expect(translatedFrom({ lang: 'en', originalLang: 'en' }, true)).toBeNull()
    expect(translatedFrom({ lang: 'es', originalLang: 'es' }, false)).toBeNull()
  })

  it('nombra el idioma original en el idioma de la página', () => {
    expect(render(h(TranslatedNote, { originalLang: 'en', lang: 'es', blog: es }))).toContain('Escrito originalmente en inglés.')
    const html = render(h(TranslatedNote, { originalLang: 'es', lang: 'en', blog: en }))
    expect(html).toContain('Originally written in Spanish.')
    expect(html).toContain('role="note"')
  })

  it('el post traducido la muestra y el fallback se queda con su aviso de siempre', () => {
    const translated = render(h(PostView, { lang: 'es', meta: post('post1', { originalLang: 'en' }), fallback: false, prepared, url: 'u', blog: es }))
    expect(translated).toContain('data-cw-translated-from="en"')
    expect(translated).not.toContain('data-cw-lang-notice')
    const fallback = render(h(PostView, { lang: 'en', meta: post('catalog', { lang: 'es' }), fallback: true, prepared, url: 'u', blog: en }))
    expect(fallback).not.toContain('data-cw-translated-from')
    expect(fallback).toContain('data-cw-lang-notice="es"')
  })
})

describe('fecha de actualización (T626, FR-516)', () => {
  it('pone la fecha en un <time> dentro del texto del idioma', () => {
    expect(splitTemplate('Actualizado el {date}', 'date')).toEqual({ before: 'Actualizado el ', after: '' })
    expect(splitTemplate('Sin marcador', 'date')).toBeNull()
    expect(render(h(UpdatedDate, { updated: '2026-11-05', lang: 'es', blog: es }))).toBe(
      '<span data-cw-updated="2026-11-05">Actualizado el <time dateTime="2026-11-05">5 de noviembre de 2026</time></span>',
    )
    expect(render(h(UpdatedDate, { updated: '2026-11-05', lang: 'en', blog: en }))).toContain('Updated <time dateTime="2026-11-05">November 5, 2026</time>')
  })

  it('va junto a la fecha de publicación solo cuando el post la declara', () => {
    const html = render(h(PostView, { lang: 'es', meta: post('p', { date: '2026-11-01', updated: '2026-11-05' }), fallback: false, prepared, url: 'u', blog: es }))
    expect(html.indexOf('dateTime="2026-11-01"')).toBeLessThan(html.indexOf('data-cw-updated="2026-11-05"'))
    expect(render(h(PostView, { lang: 'es', meta: post('p'), fallback: false, prepared, url: 'u', blog: es }))).not.toContain('data-cw-updated')
  })
})

describe('serie (T622, FR-512)', () => {
  const source: PostSeries[] = [{ id: 'building-synergos', name: { es: 'Construyendo Synergos', en: 'Building Synergos' } }]
  const parts = [
    post('a', { title: 'Parte uno', series: { id: 'building-synergos', part: 1 } }),
    post('b', { title: 'Parte dos', series: { id: 'building-synergos', part: 2 } }),
    post('c', { title: 'Parte cuatro', series: { id: 'building-synergos', part: 4 } }),
  ]

  it('cuenta solo las partes publicadas y usa el nombre del idioma', () => {
    expect(seriesNavData('c', { id: 'building-synergos', part: 4 }, parts, 'en', source)).toMatchObject({
      name: 'Building Synergos',
      position: { n: 3, total: 3 },
      current: 'c',
    })
    expect(seriesNavData('c', undefined, parts, 'es', source)).toBeNull()
    expect(seriesNavData('c', { id: 'no-existe', part: 1 }, parts, 'es', source)).toBeNull()
    expect(seriesNavData('z', { id: 'building-synergos', part: 9 }, parts, 'es', source)).toBeNull()
  })

  it('muestra "{serie} · parte {n} de {total}" y enlaza las otras partes', () => {
    const data = seriesNavData('b', { id: 'building-synergos', part: 2 }, parts, 'es', source)
    const html = render(h(SeriesNav, { series: data, lang: 'es', blog: es }))
    expect(html).toContain('Construyendo Synergos · parte 2 de 3')
    expect(html).toContain('aria-labelledby="cw-series-title"')
    expect(html).toContain('href="/es/blog/a"')
    expect(html).toContain('href="/es/blog/c"')
    expect(html).not.toContain('href="/es/blog/b"')
    expect(html).toMatch(/aria-current="page"[^>]*>Parte dos</)
  })

  it('hoy ninguna serie está publicada, así que ningún post la muestra', () => {
    expect(seriesNavData('post4', { id: 'building-synergos', part: 1 }, [post('post4')], 'es')).toBeNull()
  })
})

describe('posts relacionados (T623, FR-513)', () => {
  it('en los posts reales no repiten el anterior ni el siguiente', async () => {
    const posts = await blogPosts('es')
    const related = (id: string) => {
      const meta = posts.find((item) => item.id === id)
      if (!meta) throw new Error(id)
      const { previous, next } = adjacentPosts(posts, id)
      return relatedPosts(meta, posts, [previous?.id, next?.id].filter((other): other is string => Boolean(other))).map((item) => item.id)
    }
    expect(related('post5')).toEqual(['post7', 'post3'])
    expect(related('post3')).toEqual(['post5'])
    expect(related('post4')).toEqual(['post7', 'post6'])
    expect(related('post6')).toEqual(['post4'])
  })

  it('sin relacionados no pinta la sección; con ellos, una tarjeta enlazada por post', () => {
    expect(render(h(RelatedPosts, { posts: [], lang: 'es', blog: es }))).toBe('')
    const html = render(h(RelatedPosts, { posts: [post('post3', { lang: 'en', title: 'A story' })], lang: 'es', blog: es }))
    expect(html).toContain('Posts relacionados')
    expect(html).toContain('href="/es/blog/post3"')
    expect(html).toContain('lang="en"')
    expect(html).not.toContain('<header')
  })
})

describe('caja de autor (T624, FR-514)', () => {
  it('lleva el nombre, la línea del autor y el botón a Contacto', () => {
    const html = render(h(AuthorBox, { lang: 'en', blog: en }))
    expect(html).toContain('Camilo Hernández')
    expect(html).toContain('Software Solutions Engineer · AI-First')
    expect(html).toMatch(/href="\/en\/contactMe"[^>]*>Write to me</)
  })

  it('trae el retrato de cada tema, decorativo porque el nombre va al lado', () => {
    const html = render(h(AuthorBox, { lang: 'es', blog: es }))
    expect(html).toContain('data-cw-portrait-theme="dark"')
    expect(html).toContain('data-cw-portrait-theme="light"')
    expect(html).toContain('retrato-oscuro')
    expect(html).toContain('retrato-claro')
    expect(html.match(/alt=""/g)).toHaveLength(2)
  })
})

describe('etiquetas y portada en el post', () => {
  it('las etiquetas enlazan a su página en el idioma del contenido; el catálogo las deja como texto', () => {
    const meta = post('post4', { tags: ['Spec Driven', 'IA'] })
    const linked = render(h(PostView, { lang: 'es', meta, fallback: false, prepared, url: 'u', blog: es, linkTags: true }))
    expect(linked).toContain('href="/es/blog/tag/spec-driven"')
    expect(linked).toContain('href="/es/blog/tag/ia"')
    expect(render(h(PostView, { lang: 'es', meta, fallback: false, prepared, url: 'u', blog: es }))).not.toContain('/blog/tag/')
  })

  it('con cover generated usa la portada generada de Q1 (aquí, un doble) y si no, la imagen', () => {
    function Double({ title, date, tags, lang, variant }: GeneratedCoverProps) {
      return h('div', { 'data-double': `${title}|${date}|${tags.join(',')}|${lang}|${variant}` })
    }
    const generated = post('p', { cover: 'generated', title: 'T', date: '2026-11-05', tags: ['x'] })
    const html = render(h(PostView, { lang: 'es', meta: generated, fallback: false, prepared, url: 'u', blog: es, generatedCover: Double }))
    expect(html).toContain('data-double="T|2026-11-05|x|es|cover"')
    expect(html).not.toContain('data-cw-post-media')
    expect(render(h(PostView, { lang: 'es', meta: generated, fallback: false, prepared, url: 'u', blog: es }))).toContain('data-cw-post-media')
    expect(render(h(PostView, { lang: 'es', meta: post('p'), fallback: false, prepared, url: 'u', blog: es, generatedCover: Double }))).not.toContain('data-double')
  })
})

describe('índice en una hoja (T857)', () => {
  it('el botón aparece cuando el índice del principio ya pasó y el cuerpo sigue a la vista', () => {
    expect(tocButtonShown({ bottom: 300 }, { bottom: 3000 }, 64)).toBe(false)
    expect(tocButtonShown({ bottom: 40 }, { bottom: 3000 }, 64)).toBe(true)
    expect(tocButtonShown({ bottom: -900 }, { bottom: 50 }, 64)).toBe(false)
    expect(tocButtonShown(null, { bottom: 3000 }, 64)).toBe(false)
  })

  it('la pestaña muestra el h2 en curso con su número, también desde un h3 debajo de él', () => {
    const headings = [
      { id: 'uno', text: 'Uno', level: 2 as const },
      { id: 'uno-a', text: 'Uno A', level: 3 as const },
      { id: 'dos', text: 'Dos', level: 2 as const },
      { id: 'dos-a', text: 'Dos A', level: 3 as const },
    ]
    expect(tocChapter(headings, 'uno')).toEqual({ number: '01', text: 'Uno' })
    expect(tocChapter(headings, 'uno-a')).toEqual({ number: '01', text: 'Uno' })
    expect(tocChapter(headings, 'dos-a')).toEqual({ number: '02', text: 'Dos' })
    expect(tocChapter(headings, null)).toBeNull()
    expect(tocChapter([{ id: 'suelto', text: 'Suelto', level: 3 as const }], 'suelto')).toBeNull()
  })

  it('con índice, el post trae la hoja con su propio título y enlaces que no se confunden con los del índice', () => {
    const headings = [
      { id: 'uno', text: 'Uno', level: 2 as const },
      { id: 'dos', text: 'Dos', level: 2 as const },
      { id: 'tres', text: 'Tres', level: 3 as const },
    ]
    const html = render(h(PostView, { lang: 'es', meta: post('p'), fallback: false, prepared: { ...prepared, headings }, url: 'u', blog: es }))
    expect(html.match(/data-cw-toc=""/g)).toHaveLength(1)
    expect(html).toMatch(/<button[^>]*aria-haspopup="dialog"[^>]*data-cw-toc-button=""[^>]*data-state="hidden"><span class="cw-visually-hidden">En este post<\/span>/)
    expect(html.match(/data-cw-reading-line=""/g)).toHaveLength(1)
    expect(html.match(/data-cw-reading-progress=/g)).toHaveLength(1)
    expect(html).toContain('data-cw-toc-sheet=""')
    expect(html).toContain('id="cw-toc-sheet-title"')
    expect(html).toContain('aria-label="Cerrar"')
    expect(html.match(/data-cw-toc-link=/g)).toHaveLength(3)
    expect(html.match(/data-cw-toc-sheet-link=/g)).toHaveLength(3)
  })
})
