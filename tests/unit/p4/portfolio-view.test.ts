import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { eraLabels } from '@/components/site/portfolio/labels'
import { PortfolioView, type PortfolioViewProps } from '@/components/site/portfolio/PortfolioView'
import { projectYears, splitLede } from '@/components/site/portfolio/projects'
import { getAllTechnologies, getProjects, getSite } from '@/lib/content'
import { locales, t, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const projects = getProjects()

const KEYS = {
  title: 'portfolio.title',
  projects: 'portfolio.projects',
  eyebrow: 'portfolio.eyebrow',
  filter: 'portfolio.filter',
  filterAll: 'portfolio.filterAll',
  carousel: 'portfolio.carousel',
  carouselHint: 'portfolio.carouselHint',
  slide: 'portfolio.slide',
  prev: 'portfolio.prev',
  next: 'portfolio.next',
  current: 'portfolio.current',
  filteredAll: 'portfolio.filteredAll',
  filteredOne: 'portfolio.filteredOne',
  filteredMany: 'portfolio.filteredMany',
  viewCase: 'portfolio.viewCase',
  technologies: 'project.technologies',
  era: 'portfolio.era',
  filteredEra: 'portfolio.filteredEra',
  clearFilters: 'portfolio.clearFilters',
} as const

async function render(lang: Locale): Promise<string> {
  const dict = await getDictionary(lang, 'site')
  const text = Object.fromEntries(Object.entries(KEYS).map(([name, key]) => [name, t(dict, key)])) as Record<keyof typeof KEYS, string>
  const props: PortfolioViewProps = {
    lang,
    portfolio: getSite().portfolio,
    projects,
    technologies: getAllTechnologies(),
    labels: { ...text, eras: eraLabels(dict) },
  }
  return renderToStaticMarkup(createElement(PortfolioView, props))
}

describe('portafolio en el HTML del servidor (US1, US4)', () => {
  it.each(locales)('la intro es un único párrafo (%s)', async (lang) => {
    const html = await render(lang)
    const intro = [...html.matchAll(/<p[^>]*data-cw-portfolio-intro=""[^>]*>([\s\S]*?)<\/p>/g)]
    expect(intro).toHaveLength(1)
    expect(intro[0]![1]).toContain(lang === 'es' ? 'Aquí está mi camino completo.' : 'This is my full path.')
  })

  it.each(locales)('el hero compacto trae la cuenta y los años, la primera frase destacada y ninguna banda (%s)', async (lang) => {
    const html = await render(lang)
    const eyebrow = html.match(/data-cw-portfolio-eyebrow=""[^>]*>([^<]+)</)?.[1]
    expect(eyebrow).toBe(lang === 'es' ? `${projects.length} proyectos · 2022–2026` : `${projects.length} projects · 2022–2026`)
    expect(html).toMatch(/data-cw-portfolio-intro=""[^>]*><span class="[^"]*">(Aquí está mi camino completo\.|This is my full path\.)<\/span> /)
    expect(html).not.toContain('data-cw-portfolio-band')
    expect(html).toMatch(/<h2 id="portfolio-projects" class="cw-visually-hidden">/)
    expect(html).toMatch(/<p [^>]*data-cw-portfolio-more=""[^>]*>/)
    expect(html.match(/<p [^>]*data-cw-portfolio-more=""[^>]*>/)?.[0]).not.toContain('data-cw-glass')
  })

  it('separa la primera frase y calcula los años de las épocas', () => {
    expect(splitLede('Uno. Dos y tres.')).toEqual({ lede: 'Uno.', rest: 'Dos y tres.' })
    expect(splitLede('Sin punto final')).toEqual({ lede: 'Sin punto final', rest: '' })
    expect(projectYears(projects)).toEqual({ from: 2022, to: 2026 })
    expect(projectYears([])).toBeNull()
  })

  it.each(locales)('pinta los 15 casos en orden, cada uno con su época (%s)', async (lang) => {
    const html = await render(lang)
    const slides = [...html.matchAll(/data-cw-slide="([^"]+)"/g)].map((match) => match[1])
    expect(slides).toEqual(projects.map((project) => project.id))
    const eras = [...html.matchAll(/data-cw-era="([^"]+)"/g)].map((match) => match[1])
    expect(eras).toEqual(projects.map((project) => project.era))
    const visible = [...html.matchAll(/data-cw-era="[^"]+"><span class="cw-visually-hidden">([^<]+)<\/span>([^<]+)<\/p>/g)]
    expect(visible).toHaveLength(projects.length)
    for (const [, hidden, label] of visible) {
      expect(hidden).toBe(lang === 'es' ? 'Época: ' : 'Period: ')
      expect(['2026', '2024–2026', '2022–2023']).toContain(label)
    }
  })

  it('cada diapositiva sigue con un solo enlace: el del caso', async () => {
    const html = await render('es')
    const blocks = html.split('data-cw-slide="').slice(1)
    expect(blocks).toHaveLength(projects.length)
    for (const block of blocks) expect(block.split('role="group"')[0]!.match(/<a\b/g), block.slice(0, 4)).toHaveLength(1)
  })

  it('ofrece el filtro de época con conteos reales y sin presionar', async () => {
    const html = await render('es')
    const buttons = [...html.matchAll(/<button[^>]*data-cw-era-filter="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)]
    expect(buttons.map((match) => match[1])).toEqual(['2026', '2024-2026', '2022-2023'])
    for (const [tag, era] of buttons) {
      expect(tag).toContain('aria-pressed="false"')
      const count = projects.filter((project) => project.era === era).length
      expect(tag).toContain(`>${count}</span>`)
    }
    expect(html).toMatch(/class="cw-js-only[^"]*"[^>]*role="group"[^>]*data-cw-era-group=""/)
    expect(html).not.toContain('data-cw-projects-empty')
  })
})
