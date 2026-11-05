import { describe, expect, it } from 'vitest'
import {
  eraUsage,
  filterByEra,
  filterProjects,
  filtersSummary,
  type CombinedFilterLabels,
} from '@/components/site/portfolio/carousel'
import { eraLabels } from '@/components/site/portfolio/labels'
import { portfolioIntro, toSlide } from '@/components/site/portfolio/projects'
import { PROJECT_ERAS } from '@/content/types'
import { getProjects, getSite } from '@/lib/content'
import { locales, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const projects = getProjects()

async function summaryLabels(lang: 'es' | 'en'): Promise<CombinedFilterLabels & { eras: Record<string, string> }> {
  const dict = await getDictionary(lang, 'site')
  return {
    filteredAll: t(dict, 'portfolio.filteredAll'),
    filteredOne: t(dict, 'portfolio.filteredOne'),
    filteredMany: t(dict, 'portfolio.filteredMany'),
    filteredEra: t(dict, 'portfolio.filteredEra'),
    eras: eraLabels(dict),
  }
}

describe('época en el portafolio (FR-405)', () => {
  it('los 15 casos traen una época conocida y las dos épocas se cuentan', () => {
    expect(projects).toHaveLength(15)
    for (const project of projects) expect(PROJECT_ERAS, project.id).toContain(project.era)
    expect(eraUsage(projects)).toEqual([
      { era: '2024-2026', count: projects.filter((project) => project.era === '2024-2026').length },
      { era: '2022-2023', count: projects.filter((project) => project.era === '2022-2023').length },
    ])
    expect(eraUsage(projects).reduce((sum, item) => sum + item.count, 0)).toBe(projects.length)
  })

  it('el trabajo de hoy va primero: las épocas no se intercalan en el orden', () => {
    const order = projects.map((project) => project.era)
    expect(order.lastIndexOf('2024-2026')).toBeLessThan(order.indexOf('2022-2023'))
  })

  it('cada diapositiva lleva su época', () => {
    for (const project of projects) expect(toSlide(project, 'es').era, project.id).toBe(project.era)
  })

  it('no ofrece una época sin proyectos', () => {
    expect(eraUsage(projects.filter((project) => project.era === '2022-2023')).map((item) => item.era)).toEqual(['2022-2023'])
  })
})

describe('filtro por época combinado con tecnología (FR-405, US4 escenario 4)', () => {
  it('filtra por época sola, por tecnología sola y por las dos', () => {
    const recent = filterByEra(projects, '2024-2026')
    expect(recent.length).toBeGreaterThan(0)
    expect(recent.every((project) => project.era === '2024-2026')).toBe(true)
    expect(filterProjects(projects, { tech: null, era: null })).toHaveLength(projects.length)

    const both = filterProjects(projects, { tech: 'ANGULAR', era: '2024-2026' })
    expect(both.map((project) => project.id)).toEqual(
      projects.filter((project) => project.era === '2024-2026' && project.technologies.includes('ANGULAR')).map((project) => project.id),
    )
    expect(both.length).toBeGreaterThan(0)
  })

  it('una combinación sin proyectos da cero, no un error', () => {
    const oldOnly = projects.find((project) => project.era === '2022-2023' && project.technologies.includes('NEXT AUTH'))
    expect(oldOnly, 'NEXT AUTH vive solo en 2022–2023').toBeDefined()
    expect(projects.some((project) => project.era === '2024-2026' && project.technologies.includes('NEXT AUTH'))).toBe(false)
    expect(filterProjects(projects, { tech: 'NEXT AUTH', era: '2024-2026' })).toEqual([])
  })

  it.each(locales)('anuncia la cantidad en %s para cada combinación', async (lang) => {
    const labels = await summaryLabels(lang)
    const era = labels.eras['2024-2026']!
    if (lang === 'es') {
      expect(filtersSummary(labels, 15, null, null)).toBe('Mostrando los 15 proyectos')
      expect(filtersSummary(labels, 5, null, era)).toBe('5 proyectos de 2024–2026')
      expect(filtersSummary(labels, 1, 'ANGULAR', null)).toBe('1 proyecto con ANGULAR')
      expect(filtersSummary(labels, 0, 'NEXT AUTH', era)).toBe('0 proyectos con NEXT AUTH · 2024–2026')
    } else {
      expect(filtersSummary(labels, 15, null, null)).toBe('Showing all 15 projects')
      expect(filtersSummary(labels, 10, null, labels.eras['2022-2023']!)).toBe('10 projects from 2022–2023')
      expect(filtersSummary(labels, 0, 'NEXT AUTH', era)).toBe('0 projects with NEXT AUTH · 2024–2026')
    }
  })
})

describe('intro del portafolio (FR-404)', () => {
  it.each(locales)('es un solo párrafo, el de contenido.md §4, en %s', (lang) => {
    const portfolio = getSite().portfolio
    expect(portfolio.intro).toHaveLength(1)
    expect(portfolioIntro(portfolio, lang)).toBe(portfolio.intro[0]![lang])
    expect(portfolioIntro(portfolio, lang)).toMatch(/bootcamps/)
  })

  it('une varios párrafos en uno y no pinta nada si está vacío', () => {
    expect(portfolioIntro({ intro: [{ es: 'Uno.', en: 'One.' }, { es: ' Dos. ', en: 'Two.' }], footer: { es: '', en: '' } }, 'es')).toBe('Uno. Dos.')
    expect(portfolioIntro({ intro: [{ es: '  ', en: '' }], footer: { es: '', en: '' } }, 'en')).toBeNull()
  })
})
