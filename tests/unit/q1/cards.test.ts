import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { coverTags, GeneratedCover } from '@/components/blog/index/GeneratedCover'
import { generatedCoverOf, PostCard, type PostCardPost } from '@/components/blog/PostCard'
import { PostMedia } from '@/components/blog/PostMedia'
import { post } from '../q0/support/posts'

const render = (element: ReactElement) => renderToStaticMarkup(element)

const LABELS = { readMore: 'Leer más', originalLanguage: 'Escrito originalmente en inglés', tags: 'Etiquetas' }

function card(overrides: Partial<PostCardPost> = {}): PostCardPost {
  return { ...post('post9', { title: 'La compensación es dato', date: '2026-11-20', tags: ['sagas', 'arquitectura'] }), readingTime: '5 min de lectura', ...overrides }
}

function renderCard(item: PostCardPost, props: Record<string, unknown> = {}) {
  return render(createElement(PostCard, { post: item, href: `/es/blog/${item.id}`, lang: 'es', labels: LABELS, ...props }))
}

describe('portada generada (T613, R-502)', () => {
  it('es solo HTML y CSS: sin imagen, sin <time> y oculta para el lector de pantalla', () => {
    const html = render(createElement(GeneratedCover, { title: 'Un gate que nunca falló', date: '2026-11-20', tags: ['gates', 'tests'], lang: 'es', variant: 'card' }))
    expect(html).toMatch(/^<div[^>]*aria-hidden="true"[^>]*data-cw-generated-cover="card"/)
    expect(html).not.toMatch(/<img|<picture|<svg|url\(/)
    expect(html).not.toContain('<time')
    expect(html).toContain('CHERCED-WORLD')
    expect(html).toContain('Un gate que nunca falló')
    expect(html).toContain('20 de noviembre de 2026')
    expect(html).toContain('#gates')
    expect(html).toContain('#tests')
  })

  it('formatea la fecha en el idioma de la página y marca el idioma del título si es otro', () => {
    const html = render(createElement(GeneratedCover, { title: 'A trust boundary', date: '2026-11-20', tags: [], lang: 'es', contentLang: 'en', variant: 'cover' }))
    expect(html).toContain('data-cw-generated-cover="cover"')
    expect(html).toMatch(/lang="en"[^>]*>A trust boundary/)
    expect(html).toContain('20 de noviembre de 2026')
  })

  it('muestra hasta 3 etiquetas sin repetir', () => {
    expect(coverTags(['a', 'b', 'a', 'c', 'd'])).toEqual(['a', 'b', 'c'])
    expect(coverTags([])).toEqual([])
  })

  it('PostMedia la usa en vez de la imagen cuando recibe la fuente generada, y sin ella no cambia', () => {
    const image = { src: '/assets/imgs/posts/post5.webp', alt: 'Captura', width: 1440, height: 900 }
    const generated = render(createElement(PostMedia, { image, variant: 'card', generated: { title: 'T', date: '2026-01-01', tags: [], lang: 'es' } }))
    expect(generated).toContain('data-cw-post-media="generated"')
    expect(generated).not.toContain('<img')
    const plain = render(createElement(PostMedia, { image, variant: 'card' }))
    expect(plain).toContain('data-cw-post-media="wide"')
    expect(plain).toContain('alt="Captura"')
  })

  it("generatedCoverOf solo responde a cover: 'generated' y marca el idioma de un fallback", () => {
    expect(generatedCoverOf(card(), 'es')).toBeUndefined()
    expect(generatedCoverOf(card({ cover: 'generated' }), 'es')).toEqual({ title: 'La compensación es dato', date: '2026-11-20', tags: ['sagas', 'arquitectura'], lang: 'es', contentLang: undefined })
    expect(generatedCoverOf(card({ cover: 'generated', fallback: true, lang: 'en' }), 'es')?.contentLang).toBe('en')
  })
})

describe('tarjeta del índice (R4 sigue, 006 T857)', () => {
  it('conserva un solo enlace, "Leer más" decorativo y el tiempo de lectura', () => {
    const html = renderCard(card())
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toMatch(/<h2[^>]*><a [^>]*href="\/es\/blog\/post9"/)
    expect(html).toMatch(/aria-hidden="true" data-cw-read-more=""/)
    expect(html).toContain('data-cw-reading-time="">5 min de lectura')
    expect(html).toContain('<time dateTime="2026-11-20">')
  })

  it('flota en móvil con float={1} y no desenfoca: el presupuesto de blur no cambia', () => {
    const html = renderCard(card())
    expect(html).toContain('data-cw-float="1"')
    expect(html).not.toContain('data-cw-blur')
  })

  it("con cover: 'generated' la tarjeta lleva la portada generada y ninguna imagen", () => {
    const html = renderCard(card({ cover: 'generated' }))
    expect(html).toContain('data-cw-generated-cover="card"')
    expect(html).not.toContain('<img')
  })

  it('la variante destacada suma la etiqueta "Destacado", la portada grande y el barrido, sin otro enlace', () => {
    const html = renderCard(card(), { variant: 'featured', badge: 'Destacado', priority: true })
    expect(html).toContain('data-cw-post-variant="featured"')
    expect(html).toMatch(/data-cw-featured-badge="">.*Destacado<\/p>/)
    expect(html).toContain('data-cw-sweep=""')
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toMatch(/fetchpriority="high"/i)
  })
})
