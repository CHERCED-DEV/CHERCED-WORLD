import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  activeSection,
  localizeSections,
  navSections,
  readingLine,
  SECTION_LIMIT,
  SECTION_TAB_QUERY,
  sectionNumber,
  sectionTabGeometry,
  sectionTabState,
  sectionTimelineCss,
} from '@/components/site/section-nav/model'
import { SectionNav } from '@/components/site/section-nav/SectionNav'

const sections = [
  { id: 'scene-who', label: 'Quién soy' },
  { id: 'scene-career', label: 'Carrera' },
  { id: 'scene-knowledge', label: 'Lo que sé' },
  { id: 'scene-heading', label: 'Hacia dónde voy' },
]

const root = process.cwd()
const css = readFileSync(path.resolve(root, 'components/site/section-nav/SectionNav.module.scss'), 'utf8')
const source = readFileSync(path.resolve(root, 'components/site/section-nav/SectionNav.tsx'), 'utf8')

describe('navegación de secciones: pestaña y puntos', () => {
  it('solo se compacta en celular con movimiento, al bajar, sin toque ni foco de teclado', () => {
    const base = { compactable: true, direction: 'down', pinned: false, focused: false } as const
    expect(sectionTabState(base)).toBe('compact')
    expect(sectionTabState({ ...base, direction: 'up' })).toBe('open')
    expect(sectionTabState({ ...base, compactable: false })).toBe('open')
    expect(sectionTabState({ ...base, pinned: true })).toBe('open')
    expect(sectionTabState({ ...base, focused: true })).toBe('open')
    expect(SECTION_TAB_QUERY).toBe('(max-width: 767.98px) and (prefers-reduced-motion: no-preference)')
  })

  it('al compactarse el cristal sale por el marco y cada píldora llega al inicio, junto al número', () => {
    const lefts = [4, 88, 154, 235]
    const { shift, pulls } = sectionTabGeometry({ track: 375, start: 4, end: 4, badge: 30, scroll: 0, width: 67, lefts })
    expect(shift).toBe(375 - (4 + 30 + 67 + 4))
    pulls.forEach((pull, index) => expect(lefts[index]! + pull - shift).toBe(4 + 30))
  })

  it('cuenta el desplazamiento de la pista y nunca estira la pestaña', () => {
    const lefts = [4, 86, 148, 250]
    const { shift, pulls } = sectionTabGeometry({ track: 360, start: 4, end: 4, badge: 30, scroll: 36, width: 143, lefts })
    expect(lefts[3]! - 36 + pulls[3]! - shift).toBe(34)
    expect(sectionTabGeometry({ track: 100, start: 4, end: 4, badge: 30, scroll: 0, width: 143, lefts: [4] }).shift).toBe(0)
  })

  it('la sección activa es la última que cruzó la línea de lectura, aunque mida 7000 px', () => {
    const tops = [
      { id: 'a', top: -7200 },
      { id: 'b', top: -6900 },
      { id: 'c', top: 700 },
    ]
    const at = { line: readingLine(844, 65), viewport: 844, atEnd: false }
    expect(at.line).toBe(65 + 844 * 0.25)
    expect(activeSection(tops, at)).toBe('b')
    expect(activeSection([{ id: 'a', top: 300 }, { id: 'b', top: 900 }], at)).toBe('a')
    expect(activeSection([], at)).toBe('')
  })

  it('al final de la página marca la última sección a la vista, aunque no llegue a la línea', () => {
    const tops = [
      { id: 'a', top: -900 },
      { id: 'b', top: 200 },
      { id: 'c', top: 640 },
    ]
    expect(activeSection(tops, { line: 276, viewport: 844, atEnd: false })).toBe('b')
    expect(activeSection(tops, { line: 276, viewport: 844, atEnd: true })).toBe('c')
  })

  it('cada página pasa sus secciones como datos; el componente descarta ids inseguros, repetidos o de más', () => {
    expect(localizeSections([{ id: 'section-hero', label: { es: 'Resumen', en: 'Overview' } }, { id: 'section-faq', label: 'FAQ' }], 'en')).toEqual([
      { id: 'section-hero', label: 'Overview' },
      { id: 'section-faq', label: 'FAQ' },
    ])
    const many = Array.from({ length: SECTION_LIMIT + 3 }, (_, index) => ({ id: `s-${index}`, label: `S${index}` }))
    expect(navSections([{ id: 'a b', label: 'x' }, { id: '#x', label: 'x' }, ...sections, sections[0]!])).toEqual(sections)
    expect(navSections(many)).toHaveLength(SECTION_LIMIT)
    expect(sectionNumber(0)).toBe('01')
    expect(sectionNumber(11)).toBe('12')
  })

  it('liga cada sección con su línea de tiempo por número, solo con soporte y con movimiento', () => {
    expect(sectionTimelineCss(sections)).toBe(
      '@supports (animation-timeline: view()) and (timeline-scope: none){@media (prefers-reduced-motion: no-preference){' +
        '#scene-who{view-timeline:--cw-section-1 block;view-timeline-inset:auto}' +
        '#scene-career{view-timeline:--cw-section-2 block;view-timeline-inset:auto}' +
        '#scene-knowledge{view-timeline:--cw-section-3 block;view-timeline-inset:auto}' +
        '#scene-heading{view-timeline:--cw-section-4 block;view-timeline-inset:auto}}}',
    )
    expect(sectionTimelineCss([])).toBe('')
    expect(css).toMatch(new RegExp(`@for \\$index from 1 through \\$sections`))
    expect(css).toMatch(/\$sections: 12;/)
    expect(SECTION_LIMIT).toBe(12)
  })

  it('no sabe de qué página es: sin ids, textos ni rutas de ninguna página', () => {
    expect(source).not.toMatch(/scene-(who|career|knowledge|heading)|aboutMe|services|portfolio|synergos|ai-lab|\/now/)
    expect(css).not.toMatch(/scene-(who|career|knowledge|heading)/)
  })

  it('sin JS se sirve entera: nav con nombre, anclas numeradas, la primera actual y lo decorativo oculto', () => {
    const html = renderToStaticMarkup(createElement(SectionNav, { label: 'Escenas de Sobre mí', sections }))
    expect(html).toMatch(/<nav [^>]*aria-label="Escenas de Sobre mí"[^>]*data-cw-scene-nav=""/)
    expect(html).not.toContain('data-cw-compact')
    expect(html).not.toContain('data-cw-measured')
    expect(html.match(/<a href="#scene-[a-z]+"/g)).toEqual(sections.map((section) => `<a href="#${section.id}"`))
    expect(html.match(/data-cw-scene-index="\d+"/g)).toHaveLength(sections.length * 2)
    expect(html).toMatch(/<a href="#scene-who"[^>]*aria-current="true"/)
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
    expect(html).toMatch(/<span [^>]*aria-hidden="true" data-cw-scene-badge="">01<\/span>/)
    expect(html).toMatch(/<span [^>]*aria-hidden="true" data-cw-scene-indicator=""><\/span>/)
    expect(html).toContain('#scene-heading{view-timeline:--cw-section-4 block')
  })

  it('compacta solo en < md y con movimiento; solo anima translate, transform y opacity (FR-650, FR-653)', () => {
    expect(css).toMatch(/@include bp\.down\(md\) \{\s*@include site\.motion-ok \{[\s\S]*?\.sceneNav\[data-cw-compact\] \{/)
    const compactBlock = css.slice(css.indexOf('.sceneNav[data-cw-compact]'))
    expect(compactBlock.slice(0, compactBlock.indexOf('.sceneDots'))).not.toMatch(/\b(width|left|right|clip-path|margin|padding)\s*:/)
    const transitioned = [...css.matchAll(/transition:\s*([^;]+);/g)].flatMap((match) =>
      match[1]!.split(',').map((part) => part.trim().split(/\s+/)[0]!),
    )
    expect(transitioned).toContain('translate')
    for (const property of transitioned) expect(['none', 'color', 'translate', 'opacity', 'transform', 'visibility', 'background-color', 'border-color']).toContain(property)
  })

  it('el acento solo marca la sección activa y la línea de progreso, sin colores nuevos', () => {
    const colors = new Set([...css.matchAll(/#[0-9a-f]{3,8}\b|rgb\([^)]*\)/gi)].map((match) => match[0].toLowerCase()))
    expect([...colors].sort()).toEqual(['#000', 'rgb(37 237 158 / 0.32)', 'rgb(37 237 158 / 0.7)'])
  })
})
