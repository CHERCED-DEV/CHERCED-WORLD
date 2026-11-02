import { describe, expect, it } from 'vitest'
import {
  fillTemplate,
  filterByTechnology,
  filterSummary,
  indexForKey,
  nearestIndex,
  wrapIndex,
} from '@/components/site/portfolio/carousel'
import { caseStudyLinks, caseStudySections, toSlide, type CaseStudyLabels } from '@/components/site/portfolio/projects'
import type { Project } from '@/content/types'
import { getAllTechnologies, getProject, getProjects } from '@/lib/content'

const labels: CaseStudyLabels = {
  context: 'Context',
  role: 'My role',
  decisions: 'Key decisions',
  result: 'Result',
  technologies: 'Technologies',
  links: 'Links',
  live: 'Live',
  github: 'GitHub',
  newTab: '(opens in a new tab)',
}

function project(overrides: Partial<Project>): Project {
  const base = getProject('1')
  if (!base) throw new Error('El seed debe traer el proyecto 1')
  return { ...base, ...overrides }
}

describe('filtro por tecnología', () => {
  it('devuelve todos los proyectos sin filtro', () => {
    expect(filterByTechnology(getProjects(), null)).toHaveLength(getProjects().length)
  })

  it('deja solo los proyectos que usan la tecnología', () => {
    const items = getProjects()
    const typescript = filterByTechnology(items, 'TYPESCRIPT')
    expect(typescript.length).toBeGreaterThan(0)
    expect(typescript.every((item) => item.technologies.includes('TYPESCRIPT'))).toBe(true)
    expect(filterByTechnology(items, 'COBOL')).toEqual([])
  })

  it('ofrece como opciones solo tecnologías que tienen al menos un proyecto', () => {
    for (const tech of getAllTechnologies()) {
      expect(filterByTechnology(getProjects(), tech).length, tech).toBeGreaterThan(0)
    }
  })

  it('resume el filtro para lectores de pantalla en singular y plural', () => {
    const texts = {
      filteredAll: 'Showing all {count} projects',
      filteredOne: '1 project with {tech}',
      filteredMany: '{count} projects with {tech}',
    }
    expect(filterSummary(texts, 11, null)).toBe('Showing all 11 projects')
    expect(filterSummary(texts, 1, 'REACT')).toBe('1 project with REACT')
    expect(filterSummary(texts, 4, 'REACT')).toBe('4 projects with REACT')
  })
})

describe('carrusel', () => {
  it('da la vuelta en ambos extremos', () => {
    expect(wrapIndex(-1, 11)).toBe(10)
    expect(wrapIndex(11, 11)).toBe(0)
    expect(wrapIndex(3, 0)).toBe(0)
  })

  it('responde a flechas, Inicio y Fin, e ignora otras teclas', () => {
    expect(indexForKey('ArrowRight', 0, 3)).toBe(1)
    expect(indexForKey('ArrowLeft', 0, 3)).toBe(2)
    expect(indexForKey('Home', 2, 3)).toBe(0)
    expect(indexForKey('End', 0, 3)).toBe(2)
    expect(indexForKey('Enter', 0, 3)).toBeNull()
    expect(indexForKey('ArrowRight', 0, 0)).toBeNull()
  })

  it('calcula la diapositiva visible después de deslizar', () => {
    expect(nearestIndex(0, 400, 3)).toBe(0)
    expect(nearestIndex(390, 400, 3)).toBe(1)
    expect(nearestIndex(5000, 400, 3)).toBe(2)
    expect(nearestIndex(100, 0, 3)).toBe(0)
  })

  it('anuncia el proyecto actual con sus variables', () => {
    expect(fillTemplate('Proyecto {n} de {total}: {title}', { n: 2, total: 11, title: 'CHERCED-WORLD' })).toBe(
      'Proyecto 2 de 11: CHERCED-WORLD',
    )
    expect(fillTemplate('{n} of {total}', { n: 1 })).toBe('1 of {total}')
  })

  it('arma diapositivas con enlace localizado al caso de estudio', () => {
    const first = getProjects()[0]
    if (!first) throw new Error('Se espera al menos un proyecto')
    const slide = toSlide(first, 'en')
    expect(slide.href).toBe(`/en/portfolio/${first.id}`)
    expect(slide.image.alt).toBe(first.image.alt.en)
    expect(slide.summary).toBe(first.summary.en)
  })
})

describe('caso de estudio', () => {
  it('omite las secciones con contenido nulo o vacío, sin texto inventado', () => {
    const sections = caseStudySections(
      project({ role: null, decisions: { es: '  ', en: '' }, result: null }),
      'es',
      labels,
    )
    expect(sections.map((section) => section.id)).toEqual(['context'])
  })

  it('conserva el orden contexto, rol, decisiones y resultado', () => {
    const full = project({
      role: { es: 'Rol', en: 'Role' },
      decisions: { es: 'Decisiones', en: 'Decisions' },
      result: { es: 'Resultado', en: 'Result' },
    })
    expect(caseStudySections(full, 'en', labels).map((section) => [section.id, section.text])).toEqual([
      ['context', full.context.en],
      ['role', 'Role'],
      ['decisions', 'Decisions'],
      ['result', 'Result'],
    ])
  })

  it('muestra Live y GitHub solo si hay enlace (proyecto 10)', () => {
    expect(caseStudyLinks(project({ links: { live: null, github: null } }), labels)).toEqual([])
    expect(caseStudyLinks(project({ links: { live: null, github: 'https://github.com/x' } }), labels)).toEqual([
      { id: 'github', href: 'https://github.com/x', label: 'GitHub' },
    ])
    expect(caseStudyLinks(project({}), labels).map((link) => link.id)).toEqual(['live', 'github'])
  })
})
