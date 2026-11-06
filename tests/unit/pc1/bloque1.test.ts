import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { buildCommands, executePaletteCommand, type PaletteEffects } from '@/components/experience/palette-model'
import { CvActions, cvPdfFilename } from '@/components/ui/CvLink'
import { site } from '@/content/site'
import { PROJECT_ERAS } from '@/content/types'
import { getProjects, projectTitle } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/server'

const pdf = site.profile!.cv.pdf!

describe('B1: el CV en PDF (FR-701, FR-702)', () => {
  it('el archivo publicado es un PDF y pesa lo que dice el contenido', () => {
    const file = join(process.cwd(), 'public', pdf.href)
    expect(pdf.href).toBe('/cv/Camilo_Hernandez_CV.pdf')
    expect(statSync(file).size).toBe(pdf.bytes)
    expect(readFileSync(file).subarray(0, 5).toString('latin1')).toBe('%PDF-')
  })

  it.each([
    ['es', 'Descargar CV (PDF)', /aria-label="Descargar mi CV en PDF \(173 kB\)"/],
    ['en', 'Download CV (PDF)', /aria-label="Download my CV as a PDF \(173 kB\)"/],
  ] as const)('%s: "Descargar CV (PDF)" va junto a LinkedIn, primero y con su peso', (lang, label, aria) => {
    const html = renderToStaticMarkup(createElement(CvActions, { lang, downloadVariant: 'solid' }))
    expect(html).toMatch(/^<span class="cw-cv-actions" data-cw-cv-actions="">/)
    const download = html.indexOf('data-cw-cv-download')
    const linkedin = html.indexOf('data-cw-cv-link')
    expect(download).toBeGreaterThan(-1)
    expect(linkedin).toBeGreaterThan(download)
    expect(html).toContain(`href="/cv/Camilo_Hernandez_CV.pdf" download="Camilo_Hernandez_CV.pdf" type="application/pdf"`)
    expect(html).toMatch(aria)
    expect(html).toContain(`<span>${label}</span>`)
  })

  it.each(['es', 'en'] as const)('%s: la paleta ofrece "> descargar CV" y lo baja con su nombre', async (lang) => {
    const labels = await getDictionary(lang, 'experience')
    const commands = buildCommands(labels, {
      theme: 'dark',
      email: null,
      capsuleFound: false,
      cv: site.profile!.cv.href,
      cvPdf: { href: pdf.href, filename: cvPdfFilename(pdf) },
      now: null,
    })
    const item = commands.find((command) => command.id === 'action:cv-pdf')!
    expect(item.title).toBe(lang === 'es' ? 'Descargar CV (PDF)' : 'Download CV (PDF)')
    expect(commands.findIndex((command) => command.id === 'action:cv-pdf')).toBeLessThan(commands.findIndex((command) => command.id === 'action:cv'))
    const calls: string[] = []
    const effects = new Proxy({} as PaletteEffects, {
      get: (_target, name) => (...args: unknown[]) => calls.push([String(name), ...args].join(' ')),
    })
    executePaletteCommand(item.command, effects)
    expect(calls).toEqual(['close', 'download /cv/Camilo_Hernandez_CV.pdf Camilo_Hernandez_CV.pdf'])
  })
})

describe('B2 y B3: títulos en español y época 2026 de los casos 13, 14 y 15 (FR-704, FR-705)', () => {
  const TITLES: Record<string, { es: string; en: string }> = {
    '13': { es: 'Director y líneas: agentes de IA en paralelo', en: 'Director & lines: parallel AI agents' },
    '14': { es: 'Espacio de trabajo legal', en: 'Legal workspace' },
    '15': { es: 'Puente de eventos: AWS → Azure', en: 'Event bridge: AWS → Azure' },
  }

  it.each(Object.entries(TITLES))('caso %s', (id, titles) => {
    const project = getProjects().find((item) => item.id === id)!
    expect(projectTitle(project, 'es')).toBe(titles.es)
    expect(projectTitle(project, 'en')).toBe(titles.en)
    expect(project.era).toBe('2026')
  })

  it('2026 es la época más reciente y va primero en el filtro', () => {
    expect(PROJECT_ERAS[0]).toBe('2026')
  })
})

describe('B10: títulos de las páginas (FR-706)', () => {
  it.each(['es', 'en'] as const)('%s', async (lang) => {
    const common = await getDictionary(lang, 'common')
    const home = await getDictionary(lang, 'site')
    expect(home['meta.home.title']).toBe('Camilo Hernández · Software Solutions Engineer · AI-First')
    expect(common['meta.title']).toBe('Camilo Hernández · Software Solutions Engineer · AI-First')
    expect(common['meta.titleTemplate']).toBe('%s · Camilo Hernández')
  })
})
