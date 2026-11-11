import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CaseStudy, type CaseStudyExtras } from '@/components/site/portfolio/CaseStudy'
import { caseEvidenceLabels, caseStudyExtraLabels, evidenceKeys } from '@/components/site/portfolio/labels'
import {
  caseAdrCards,
  caseDiagram,
  caseStorySections,
  caseStudyNeighbors,
  caseStudyRepos,
  technologyCounts,
  type CaseStudyLabels,
} from '@/components/site/portfolio/projects'
import { isPlainClick, markSharedNavigation, projectMediaName, takeSharedNavigation } from '@/components/site/portfolio/transition'
import type { Locale, Project } from '@/content/types'
import { getProject, getProjects } from '@/lib/content'
import { locales, t } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'

const projects = getProjects()
const synergos = getProject('12')!

async function caseLabels(lang: Locale): Promise<CaseStudyLabels> {
  const dict = await getDictionary(lang, 'site')
  return {
    context: t(dict, 'project.context'),
    role: t(dict, 'project.role'),
    decisions: t(dict, 'project.decisions'),
    result: t(dict, 'project.result'),
    technologies: t(dict, 'project.technologies'),
    links: t(dict, 'project.links'),
    live: t(dict, 'project.live'),
    github: t(dict, 'project.github'),
    newTab: t(dict, 'a11y.newTab'),
  }
}

async function extras(lang: Locale, project: Project, withEvidence = true): Promise<CaseStudyExtras> {
  const [site, portfolio] = await Promise.all([getDictionary(lang, 'site'), getDictionary(lang, 'portfolio')])
  return {
    labels: caseStudyExtraLabels(portfolio),
    neighbors: caseStudyNeighbors(projects, project.id, lang),
    usage: technologyCounts(projects),
    portfolioHref: `/${lang}/portfolio`,
    ...(withEvidence ? { evidence: caseEvidenceLabels(site) } : {}),
  }
}

async function render(project: Project, lang: Locale = 'es', withEvidence = true): Promise<string> {
  return renderToStaticMarkup(
    createElement(CaseStudy, { project, lang, labels: await caseLabels(lang), extras: await extras(lang, project, withEvidence) }),
  )
}

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

describe('textos nuevos del caso', () => {
  it.each(locales)('existen en site.json (%s) y no se repiten', async (lang) => {
    const dict = await getDictionary(lang, 'site')
    for (const key of evidenceKeys()) expect(t(dict, key).trim(), key).not.toBe('')
    expect(new Set(evidenceKeys()).size).toBe(evidenceKeys().length)
    const labels = caseEvidenceLabels(dict)
    expect(labels.adr).toEqual(
      lang === 'es' ? { decision: 'Decisión', why: 'Por qué', tradeoff: 'Trade-off' } : { decision: 'Decision', why: 'Why', tradeoff: 'Trade-off' },
    )
    expect(labels.eras).toEqual({ '2026': '2026', '2024-2026': '2024–2026', '2022-2023': '2022–2023' })
  })
})

describe('tarjetas ADR (FR-442)', () => {
  it('Synergos trae sus 4 tarjetas, completas en ES y EN', () => {
    for (const lang of locales) {
      const cards = caseAdrCards(synergos, lang)
      expect(cards).toHaveLength(4)
      expect(cards.map((card) => card.decision)).toEqual(synergos.adrCards!.map((card) => card.decision[lang]))
    }
  })

  it('ningún otro caso trae tarjetas todavía (P-408)', () => {
    for (const project of projects.filter((item) => item.id !== '12')) expect(caseAdrCards(project, 'es'), project.id).toEqual([])
  })

  it('descarta una tarjeta con un campo vacío', () => {
    const broken = { ...synergos, adrCards: [{ ...synergos.adrCards![0]!, why: { es: ' ', en: 'x' } }] }
    expect(caseAdrCards(broken, 'es')).toEqual([])
    expect(caseAdrCards(broken, 'en')).toHaveLength(1)
  })

  it('con tarjetas, "Decisiones clave" pasa de prosa a tarjetas y conserva su lugar', async () => {
    const labels = await caseLabels('es')
    const sections = caseStorySections(synergos, 'es', labels, true)
    expect(sections.map((section) => section.id)).toEqual(['context', 'role', 'decisions', 'result'])
    const decisions = sections.find((section) => section.id === 'decisions')!
    expect(decisions).toMatchObject({ cards: true, paragraphs: [] })

    const withoutProse = caseStorySections({ ...synergos, decisions: null }, 'es', labels, true)
    expect(withoutProse.map((section) => [section.id, section.cards])).toEqual([
      ['context', false],
      ['role', false],
      ['decisions', true],
      ['result', false],
    ])
    expect(caseStorySections(synergos, 'es', labels, false).find((section) => section.id === 'decisions')?.paragraphs.length).toBeGreaterThan(0)
  })

  it.each(locales)('Synergos pinta Decisión · Por qué · Trade-off en %s, sin la prosa de decisiones', async (lang) => {
    const html = await render(synergos, lang)
    expect(html.match(/data-cw-adr=""/g)).toHaveLength(4)
    const text = textOf(html)
    for (const card of synergos.adrCards!) {
      for (const field of ['decision', 'why', 'tradeoff'] as const) expect(text).toContain(card[field][lang])
    }
    expect(html.match(/<dt\b/g)).toHaveLength(12)
    expect(text).not.toContain(synergos.decisions![lang].slice(0, 60))
    expect(html).toMatch(/data-cw-case-section="decisions"[\s\S]*data-cw-adr-cards=""[\s\S]*data-cw-case-section="result"/)
  })

  it('un caso sin tarjetas deja "Decisiones clave" en prosa (US4 escenario 2)', async () => {
    const project = projects.find((item) => item.decisions && !item.adrCards)!
    const html = await render(project)
    expect(html).not.toContain('data-cw-adr')
    expect(textOf(html)).toContain(project.decisions!.es.split('\n')[0]!.slice(0, 60))
  })
})

describe('diagrama vivo (FR-445)', () => {
  it('Synergos trae tres capas en orden CDN → Umbraco → micro-frontends', () => {
    expect(caseDiagram(synergos, 'es').map((layer) => layer.id)).toEqual(['cdn', 'umbraco', 'micro-frontends'])
    for (const lang of locales) {
      for (const layer of caseDiagram(synergos, lang)) expect(layer.role.length, layer.id).toBeGreaterThan(20)
    }
  })

  it('no dibuja un diagrama de una sola capa ni en los casos que no lo traen', () => {
    expect(caseDiagram({ ...synergos, diagram: synergos.diagram!.slice(0, 1) }, 'es')).toEqual([])
    for (const project of projects.filter((item) => item.id !== '12')) expect(caseDiagram(project, 'es'), project.id).toEqual([])
  })

  it.each(locales)('en el HTML del servidor (%s) las capas son botones y las tres líneas de rol se leen como texto', async (lang) => {
    const html = await render(synergos, lang)
    const layers = [...html.matchAll(/<button[^>]*data-cw-diagram-layer="([^"]+)"[^>]*>/g)]
    expect(layers.map((match) => match[1])).toEqual(['cdn', 'umbraco', 'micro-frontends'])
    for (const [index, [tag]] of layers.entries()) {
      expect(tag).toContain('type="button"')
      expect(tag, 'U8: la capa 01 llega elegida').toContain(`aria-pressed="${index === 0}"`)
      const described = tag.match(/aria-describedby="([^"]+)"/)?.[1]
      expect(described).toBeTruthy()
      expect(html).toContain(`id="${described}"`)
    }
    const text = textOf(html)
    for (const layer of synergos.diagram!) expect(text).toContain(layer.role[lang])
    expect(html).not.toContain('data-lit')
    const dict = await getDictionary(lang, 'site')
    expect(text).toContain(t(dict, 'case.diagram.title'))
  })
})

describe('repositorios (FR-447)', () => {
  it('Synergos enlaza sus tres repos públicos', () => {
    expect(caseStudyRepos(synergos).map((repo) => repo.label)).toEqual(['Synergos.CMS', 'Synergos.UI', 'Synergos.Fabrica'])
    for (const repo of caseStudyRepos(synergos)) expect(repo.href).toMatch(/^https:\/\/github\.com\//)
  })

  it('Legal workspace va sin repo (P-420), Event bridge sin enlaces y Director y líneas con el arnés público (FR-712 de la 007)', () => {
    for (const id of ['14', '15']) {
      const project = getProject(id)!
      expect(caseStudyRepos(project), id).toEqual([])
      expect(project.links, id).toMatchObject({ live: null, github: null })
    }
    expect(caseStudyRepos(getProject('13')!)).toEqual([{ label: 'Synergos.Fabrica', href: 'https://github.com/CHERCED-DEV/Synergos.Fabrica' }])
    expect(synergos.links.live).toBe('https://synergos-ui.synergos-labs.workers.dev/')
  })

  it('descarta repos sin https, sin nombre o repetidos', () => {
    const repos = [
      { label: 'A', href: 'https://github.com/x/a' },
      { label: 'A otra vez', href: 'https://github.com/x/a' },
      { label: ' ', href: 'https://github.com/x/b' },
      { label: 'C', href: 'javascript:alert(1)' },
      { label: 'D', href: 'http://github.com/x/d' },
    ]
    expect(caseStudyRepos({ ...synergos, links: { live: null, github: null, repos } })).toEqual([{ label: 'A', href: 'https://github.com/x/a' }])
  })

  it.each(locales)('cada repo abre en pestaña nueva con aviso accesible (%s)', async (lang) => {
    const html = await render(synergos, lang)
    const anchors = [...html.matchAll(/<a [^>]*data-cw-case-repo="[^"]+"[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0])
    expect(anchors).toHaveLength(3)
    const newTab = t(await getDictionary(lang, 'site'), 'a11y.newTab')
    for (const anchor of anchors) {
      expect(anchor).toContain('target="_blank"')
      expect(anchor).toContain('rel="noopener noreferrer"')
      expect(anchor).toContain(newTab)
    }
    expect(html).toMatch(/<nav [^>]*aria-label="[^"]+"[\s\S]*data-cw-case-repos=""/)
  })
})

describe('época y compatibilidad del caso', () => {
  it.each(locales)('cada caso muestra su época en el encabezado (%s)', async (lang) => {
    for (const project of projects) {
      const html = await render(project, lang)
      expect(html, project.id).toContain(`data-cw-case-era="${project.era}"`)
      expect(html.match(/<h1\b/g), project.id).toHaveLength(1)
    }
  })

  it('sin etiquetas de evidencia, el caso queda como en la 002', async () => {
    const html = await render(synergos, 'es', false)
    expect(html).not.toContain('data-cw-adr')
    expect(html).not.toContain('data-cw-diagram')
    expect(html).not.toContain('data-cw-case-era')
    expect(textOf(html)).toContain(synergos.decisions!.es.slice(0, 60))
  })

  it('el nombre de la transición es un ident CSS válido y único por caso', () => {
    const names = projects.map((project) => projectMediaName(project.id))
    expect(new Set(names).size).toBe(projects.length)
    for (const name of names) expect(name).toMatch(/^project-media-[A-Za-z0-9_-]+$/)
    expect(projectMediaName('a b/c')).toBe('project-media-a-b-c')
  })

  it('el aviso de navegación compartida sirve una sola vez y solo para su caso', () => {
    markSharedNavigation(projectMediaName('12'))
    expect(takeSharedNavigation(projectMediaName('13'))).toBe(false)
    expect(takeSharedNavigation(projectMediaName('12'))).toBe(false)
    markSharedNavigation(projectMediaName('12'))
    expect(takeSharedNavigation(projectMediaName('12'))).toBe(true)
    expect(takeSharedNavigation(projectMediaName('12'))).toBe(false)
  })

  it('solo un clic simple marca la navegación compartida', () => {
    const plain = { button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, defaultPrevented: false }
    expect(isPlainClick(plain)).toBe(true)
    for (const change of [{ button: 1 }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { defaultPrevented: true }]) {
      expect(isPlainClick({ ...plain, ...change }), JSON.stringify(change)).toBe(false)
    }
  })
})
