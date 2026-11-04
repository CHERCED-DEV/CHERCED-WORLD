import { createElement, Fragment, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CodeBlock, MdxH2 } from '@/components/blog/mdx'
import { PAGE_IDS, readingStats } from '@/components/blog/mdx/prepare'
import { isWideImage, PostMedia } from '@/components/blog/PostMedia'

const h = createElement

describe('portada del post', () => {
  it('trata como ancha solo una imagen grande y apaisada', () => {
    expect(isWideImage({ width: 1440, height: 900 })).toBe(true)
    expect(isWideImage({ width: 1200, height: 630 })).toBe(true)
    expect(isWideImage({ width: 256, height: 256 })).toBe(false)
    expect(isWideImage({ width: 1200, height: 1200 })).toBe(false)
    expect(isWideImage({ width: 800, height: 400 })).toBe(false)
  })

  it('una imagen pequeña lleva un fondo ambiental decorativo de sí misma y una sola imagen con alt', () => {
    const html = renderToStaticMarkup(
      h(PostMedia, { image: { src: '/assets/imgs/mePost.webp', alt: 'El autor', width: 256, height: 256 }, variant: 'cover' }),
    )
    expect(html).toContain('data-cw-post-media="compact"')
    expect(html.match(/<img/g)).toHaveLength(2)
    expect(html).toMatch(/<img[^>]*alt=""[^>]*aria-hidden="true"|<img[^>]*aria-hidden="true"[^>]*alt=""/)
    expect(html).toContain('alt="El autor"')
  })

  it('la portada ancha es una sola imagen y se pide con prioridad', () => {
    const html = renderToStaticMarkup(
      h(PostMedia, { image: { src: '/assets/imgs/posts/post5.webp', alt: 'Captura', width: 1440, height: 900 }, variant: 'cover', priority: true }),
    )
    expect(html).toContain('data-cw-post-media="wide"')
    expect(html.match(/<img/g)).toHaveLength(1)
    expect(html).toMatch(/fetchpriority="high"/i)
    expect(html).not.toContain('loading="lazy"')
  })
})

describe('tiempo de lectura de las tarjetas', () => {
  it('cuenta las palabras del texto y no las del código', () => {
    function Post(): ReactNode {
      return h(Fragment, null, h('p', null, 'Uno dos tres cuatro.'), h(MdxH2, null, 'Título'), h(CodeBlock, null, h('code', null, 'const no = cuenta + nada')))
    }
    expect(readingStats(Post)).toEqual({ words: 5, minutes: 1 })
  })

  it('reserva los ids de la página para que un encabezado no choque con ellos', () => {
    for (const id of ['main', 'header', 'cw-post-body', 'cw-toc-title', 'cw-post-nav-title', 'cw-comments']) {
      expect(PAGE_IDS).toContain(id)
    }
  })
})
