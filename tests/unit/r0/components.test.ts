import { createElement, type ReactElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { CornerMarks, GlowOrb, GridLines, Hairline, Scanline } from '@/components/ui/graphics'
import { Reveal } from '@/components/ui/Reveal'
import type { Project } from '@/content/types'

const render = (element: ReactElement) => renderToStaticMarkup(element)

describe('GlassSurface con capas opcionales', () => {
  it('por defecto queda como en la 001', () => {
    const html = render(createElement(GlassSurface, { variant: 'subtle' }, 'hola'))
    expect(html).toMatch(/^<div data-cw-glass="subtle" class="[^"]*">hola<\/div>$/)
    expect(html).not.toContain('data-cw-light')
  })

  it('la luz marca el elemento para el puntero y suma las clases de capa', () => {
    const plain = render(createElement(GlassSurface, {}, 'x'))
    const lit = render(createElement(GlassSurface, { as: 'article', edge: true, grain: true, depth: true, light: true }, 'x'))
    expect(lit).toMatch(/^<article data-cw-glass="standard" data-cw-light="" class="/)
    const classes = (html: string) => (/class="([^"]*)"/.exec(html)?.[1] ?? '').split(' ').filter(Boolean)
    expect(classes(lit).length).toBeGreaterThan(classes(plain).length)
  })
})

describe('grafismos', () => {
  const graphics = {
    GridLines: render(createElement(GridLines, { cell: 40, fade: 'top', accent: true })),
    Hairline: render(createElement(Hairline, { glint: true, orientation: 'vertical' })),
    CornerMarks: render(createElement(CornerMarks, { size: 18, inset: 6, accent: true })),
    GlowOrb: render(createElement(GlowOrb, { tone: 'fg', size: 'lg', x: '10%', y: '90%', pulse: true })),
    Scanline: render(createElement(Scanline, { axis: 'y', delay: 300 })),
  }

  it.each(Object.entries(graphics))('%s es decorativo, sin texto ni interacción', (_, html) => {
    expect(html).toMatch(/^<span aria-hidden="true" data-cw-graphic="[a-z]+"/)
    expect(html).not.toMatch(/<(a|button|input|script)\b/)
    expect(html.replace(/<[^>]+>/g, '')).toBe('')
    expect(html).not.toMatch(/\son[a-z]+=/i)
  })

  it('pasa los parámetros como variables CSS', () => {
    expect(graphics.GridLines).toContain('--_cell:40px')
    expect(graphics.CornerMarks).toContain('--_size:18px')
    expect(graphics.CornerMarks).toContain('--_inset:6px')
    expect(graphics.GlowOrb).toContain('--_x:10%')
    expect(graphics.Scanline).toContain('--_delay:300ms')
  })
})

describe('Reveal', () => {
  it('se renderiza visible en el servidor (sin JS el contenido se ve completo)', () => {
    const html = render(createElement(Reveal, { as: 'section', delay: 140, id: 's1' }, 'contenido'))
    expect(html).toBe('<section id="s1" style="--cw-reveal-delay:140ms" data-cw-reveal="">contenido</section>')
  })
})

describe('enmienda E-02', () => {
  it('Project acepta galería y resultados destacados opcionales', () => {
    const extra: Pick<Project, 'gallery' | 'highlights'> = {
      gallery: [{ src: '/assets/imgs/x.png', alt: { es: 'x', en: 'x' }, width: 10, height: 10 }],
      highlights: [{ es: 'Resultado', en: 'Result' }],
    }
    const none: Pick<Project, 'gallery' | 'highlights'> = {}
    expect(extra.gallery).toHaveLength(1)
    expect(none.gallery).toBeUndefined()
  })
})
