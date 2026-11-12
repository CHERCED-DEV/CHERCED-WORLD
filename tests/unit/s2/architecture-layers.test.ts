import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { compile } from 'sass'
import { describe, expect, it } from 'vitest'
import { ArchitectureDiagram } from '@/components/site/synergos/arquitectura/ArchitectureDiagram'
import { architecture } from '@/content/synergos-architecture'

const root = process.cwd()
const file = join(root, 'components', 'site', 'synergos', 'arquitectura', 'Architecture.module.scss')
const source = readFileSync(file, 'utf8')
const css = compile(file, { loadPaths: [join(root, 'styles')], style: 'expanded' }).css

function block(text: string, start: string): string {
  const from = text.indexOf(start)
  expect(from, start).toBeGreaterThanOrEqual(0)
  let depth = 0
  for (let index = text.indexOf('{', from); index < text.length; index++) {
    if (text[index] === '{') depth++
    if (text[index] === '}' && --depth === 0) return text.slice(from, index + 1)
  }
  throw new Error(`bloque sin cerrar: ${start}`)
}

function properties(body: string): string[] {
  return [...new Set([...body.matchAll(/^\s+([\w-]+):/gm)].map((match) => match[1]!))]
}

describe('arquitectura en el celular: capas guiadas por scroll (009, refinamiento del 2026-11-12)', () => {
  it('las capas y el llenado del riel solo animan transform y opacity (FR-653)', () => {
    expect(properties(block(css, '@keyframes architecture-layer')).sort()).toEqual(['opacity', 'transform'])
    expect(properties(block(css, '@keyframes architecture-fill'))).toEqual(['transform'])
  })

  it('cada animation-timeline nueva va dentro de @supports y de prefers-reduced-motion: no-preference', () => {
    const layers = block(css, '@supports (animation-timeline: view()) and (animation-range: entry 0% entry 100%)')
    expect(layers).toMatch(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*:root\[data-js\][\s\S]*animation-timeline: view\(\)/)
    const fill = block(css, '@supports (animation-timeline: view()) and (timeline-scope: none)')
    expect(fill).toMatch(/@media \(prefers-reduced-motion: no-preference\)[\s\S]*timeline-scope: --arq-recorrido/)
    for (const id of Object.keys(architecture.copy.sections)) {
      expect(fill).toContain(`view-timeline: --arq-${id} block`)
      expect(fill).toContain(`animation-timeline: --arq-${id}`)
    }
    const outside = css.replace(layers, '').replace(fill, '')
    expect(outside).not.toMatch(/animation-timeline/)
  })

  it('las capas solo existen con JavaScript: sin JS la página queda estática', () => {
    const layers = block(css, '@supports (animation-timeline: view()) and (animation-range: entry 0% entry 100%)')
    for (const rule of layers.match(/[^{}]+\{\s*animation: architecture-layer/g) ?? []) expect(rule).toContain(':root[data-js]')
    expect(layers.match(/animation: architecture-layer/g)?.length).toBeGreaterThan(0)
  })

  it('la página no usa scroll-snap', () => {
    expect(source).not.toMatch(/scroll-snap/)
  })

  it('el riel de capítulos esconde la barra de scroll y deja cada píldora en una línea', () => {
    const toc = block(css, '.toc {')
    expect(toc).toContain('scrollbar-width: none')
    expect(toc).toContain('overflow-x: auto')
    expect(css).toMatch(/\.toc::-webkit-scrollbar \{\s*display: none;/)
    expect(block(css, '.toc a {')).toContain('white-space: nowrap')
  })
})

describe.each(['es', 'en'] as const)('el flujo de cada diagrama en texto (%s)', (lang) => {
  it.each(Object.keys(architecture.diagrams) as Array<keyof typeof architecture.diagrams>)('%s: cinco pasos con su número, título y detalle en una sola columna', (kind) => {
    const html = renderToStaticMarkup(createElement(ArchitectureDiagram, { kind, lang }))
    const steps = html.match(/<li class="[^"]*" data-cw-architecture-step="">[\s\S]*?<\/li>/g) ?? []
    expect(steps).toHaveLength(5)
    architecture.diagrams[kind].forEach((node, index) => {
      expect(steps[index]).toContain(`>${String(index + 1).padStart(2, '0')}<`)
      expect(steps[index]).toContain(`<strong>${node.title[lang].replace(/&/g, '&amp;')}</strong>`)
      expect(steps[index]).toContain(node.detail[lang])
    })
    expect(html).not.toContain('data-cw-architecture-svg="tall"')
    expect(html.match(/data-cw-architecture-svg="wide"/g)).toHaveLength(1)
  })
})
