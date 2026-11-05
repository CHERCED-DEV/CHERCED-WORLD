import { createElement, Fragment, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { postLabels } from '@/components/blog/labels'
import { Callout, CALLOUT_TYPES, DEFAULT_CALLOUT_LABELS, isDiagram, MdxImage, mdxComponents } from '@/components/blog/mdx'
import { PAGE_IDS, preparePost } from '@/components/blog/mdx/prepare'
import { calloutLabels } from '@/components/blog/post/labels'
import blogEn from '@/content/i18n/en/blog.json'
import { getDictionary } from '@/lib/i18n/server'

function h(type: unknown, props: Record<string, unknown> | null, ...children: unknown[]): ReactElement {
  return createElement(type as never, props as never, ...(children as ReactNode[]))
}

const render = (node: ReactNode) => renderToStaticMarkup(h(Fragment, null, node))

describe('Callout (T620, FR-510, R-505)', () => {
  it('es un aside cuyo nombre es su etiqueta visible, que va antes del texto', () => {
    const html = render(h(Callout, { type: 'tradeoff', labels: { decision: 'D', tradeoff: 'Trade-off', learned: 'L', lang: 'es' } }, h('p', null, 'Pesa menos.')))
    const id = /aria-labelledby="([^"]+)"/.exec(html)?.[1]
    expect(id).toBeTruthy()
    expect(html).toMatch(/^<aside class="[^"]*" aria-labelledby="[^"]+" data-cw-callout="tradeoff">/)
    expect(html).toContain(`<p id="${id}"`)
    expect(html.indexOf('Trade-off')).toBeLessThan(html.indexOf('Pesa menos.'))
    expect(html).toContain('lang="es"')
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/)
  })

  it('tiene los tres tipos, cada uno con su texto, y un tipo desconocido cae en "Decisión"', () => {
    expect(CALLOUT_TYPES).toEqual(['decision', 'tradeoff', 'learned'])
    for (const type of CALLOUT_TYPES) expect(render(h(Callout, { type }, 'x'))).toContain(`data-cw-callout="${type}"`)
    expect(render(h(Callout, { type: 'otro' }, 'x'))).toContain('data-cw-callout="decision"')
    expect(render(h(Callout, { type: 'learned' }, 'x'))).toContain(DEFAULT_CALLOUT_LABELS.learned)
  })

  it('cada callout de una página tiene su propio id', () => {
    const html = render(h(Fragment, null, h(Callout, { type: 'decision' }, 'a'), h(Callout, { type: 'learned' }, 'b')))
    const ids = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1])
    expect(new Set(ids).size).toBe(2)
  })

  it('está registrado en el MDX y recibe los textos del idioma de la página al preparar el post', async () => {
    expect(mdxComponents.Callout).toBe(Callout)
    const blog = await getDictionary('en', 'blog')
    function Post(): ReactNode {
      return h(Fragment, null, h(Callout, { type: 'learned' }, h('p', null, 'Romper el gate a propósito.')))
    }
    const prepared = preparePost(Post, { ...postLabels(blog), callout: calloutLabels(blog, 'en') })
    const html = render(prepared.body)
    expect(html).toContain(blogEn['callout.learned'])
    expect(html).toContain('lang="en"')
    expect(prepared.words).toBe(5)
  })

  it('reserva los ids de las piezas nuevas del post', () => {
    for (const id of ['cw-toc-sheet-title', 'cw-series-title', 'cw-author-title', 'cw-related-title']) expect(PAGE_IDS).toContain(id)
  })
})

describe('diagramas SVG (T621, FR-511)', () => {
  it('un SVG va en un marco propio que se desplaza y se enfoca, con su texto alternativo', () => {
    const html = render(h(MdxImage, { src: '/assets/imgs/catalog/diagrama-blog.svg', alt: 'Diagrama de capas' }))
    expect(html).toMatch(/^<span class="[^"]*" tabindex="0" data-cw-diagram="">/)
    expect(html).toContain('alt="Diagrama de capas"')
    expect(html).toContain('src="/assets/imgs/catalog/diagrama-blog.svg"')
    expect(html).toContain('loading="lazy"')
  })

  it('reconoce el SVG con query o hash y no toca las demás imágenes', () => {
    expect(isDiagram('/a/b.svg')).toBe(true)
    expect(isDiagram('/a/b.SVG?v=2')).toBe(true)
    expect(isDiagram('/a/b.svg.webp')).toBe(false)
    const html = render(h(MdxImage, { src: '/assets/icons/brandLogoX2.png', alt: 'Logo' }))
    expect(html).not.toContain('data-cw-diagram')
  })
})
