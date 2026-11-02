import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CaseStudy } from '@/components/site/portfolio/CaseStudy'
import type { CaseStudyLabels } from '@/components/site/portfolio/projects'
import type { Project } from '@/content/types'
import { getProject } from '@/lib/content'

const labels: CaseStudyLabels = {
  context: 'Contexto',
  role: 'Mi rol',
  decisions: 'Decisiones clave',
  result: 'Resultado',
  technologies: 'Tecnologías de este proyecto',
  links: 'Enlaces del proyecto',
  live: 'En vivo',
  github: 'GitHub',
  newTab: '(se abre en una pestaña nueva)',
}

function render(overrides: Partial<Project>): string {
  const base = getProject('1')
  if (!base) throw new Error('El seed debe traer el proyecto 1')
  return renderToStaticMarkup(createElement(CaseStudy, { project: { ...base, ...overrides }, lang: 'es', labels }))
}

describe('render del caso de estudio', () => {
  it('abre Live y GitHub en pestaña nueva con rel seguro', () => {
    const html = render({})
    const anchors = [...html.matchAll(/<a [^>]*data-cw-case-link="(live|github)"[^>]*>/g)]
    expect(anchors.map((match) => match[1])).toEqual(['live', 'github'])
    for (const [tag] of anchors) {
      expect(tag).toContain('target="_blank"')
      expect(tag).toContain('rel="noopener noreferrer"')
    }
    expect(html).toContain('(se abre en una pestaña nueva)')
  })

  it('no pinta botones ni navegación de enlaces si el proyecto no tiene enlaces', () => {
    const html = render({ links: { live: null, github: null } })
    expect(html).not.toContain('data-cw-case-link')
    expect(html).not.toContain('Enlaces del proyecto')
    expect(html).not.toContain('target="_blank"')
  })

  it('omite el encabezado de cada sección nula', () => {
    const html = render({ role: null, decisions: null, result: null })
    expect(html).toContain('data-cw-case-section="context"')
    expect(html).not.toContain('Mi rol')
    expect(html).not.toContain('Decisiones clave')
    expect(html).not.toContain('>Resultado<')
  })

  it('pinta como párrafos separados los textos con línea en blanco', () => {
    const html = render({ context: { es: 'Primer párrafo.\n\nSegundo párrafo.', en: 'First.\n\nSecond.' } })
    expect(html).toMatch(/<p[^>]*>Primer párrafo\.<\/p><p[^>]*>Segundo párrafo\.<\/p>/)
  })

  it('usa un único h1 con el título del proyecto', () => {
    const html = render({})
    expect(html.match(/<h1\b/g)).toHaveLength(1)
    expect(html).toMatch(/<h1[^>]*>Quantic Theatrum<\/h1>/)
  })
})
