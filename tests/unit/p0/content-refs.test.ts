import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { now } from '@/content/now'
import { projects } from '@/content/projects'
import { lobeWords, publicEmail, site } from '@/content/site'
import {
  completeTerminalInput,
  findTerminalCommand,
  projectSlugs,
  runTerminal,
  TERMINAL_MAX_INPUT,
  terminalCommands,
} from '@/content/terminal'
import { isServiceId, PROJECT_ERAS, SERVICE_IDS, type Localized } from '@/content/types'

vi.mock('@/content/posts/registry', () => ({ postRegistry: {} }))

const ORDER: Array<[string, string]> = [
  ['12', '2024-2026'],
  ['13', '2026'],
  ['2', '2024-2026'],
  ['14', '2026'],
  ['15', '2026'],
  ['1', '2022-2023'],
  ['3', '2022-2023'],
  ['4', '2022-2023'],
  ['5', '2022-2023'],
  ['6', '2022-2023'],
  ['7', '2022-2023'],
  ['8', '2022-2023'],
  ['9', '2022-2023'],
  ['10', '2022-2023'],
  ['11', '2022-2023'],
]

const sorted = [...projects].sort((a, b) => a.order - b.order)
const lobes = site.about.skills.lobes ?? []

function filled(value: Localized | undefined, at: string) {
  expect(value, at).toBeDefined()
  for (const lang of ['es', 'en'] as const) expect(value![lang].trim(), `${at}.${lang}`).not.toBe('')
}

describe('portafolio: 15 casos, orden y época (FR-405, FR-443, E-04)', () => {
  it('sigue el orden de contenido.md §4 con su época', () => {
    expect(sorted.map((project) => [project.id, project.era])).toEqual(ORDER)
    expect(sorted.map((project) => project.order)).toEqual(ORDER.map((_, index) => index + 1))
    for (const project of projects) expect(PROJECT_ERAS, project.id).toContain(project.era)
  })

  it('solo Synergos trae tarjetas ADR, diagrama y repos', () => {
    const synergos = projects.find((project) => project.id === '12')!
    expect(synergos.adrCards).toHaveLength(4)
    for (const card of synergos.adrCards ?? []) {
      filled(card.decision, 'decision')
      filled(card.why, 'why')
      filled(card.tradeoff, 'tradeoff')
    }
    expect(synergos.diagram?.map((layer) => layer.id)).toEqual(['cdn', 'umbraco', 'micro-frontends'])
    for (const layer of synergos.diagram ?? []) {
      filled(layer.label, `${layer.id}.label`)
      filled(layer.role, `${layer.id}.role`)
    }
    expect(synergos.links).toEqual({
      live: 'https://synergos-ui.synergos-labs.workers.dev/',
      github: null,
      repos: [
        { label: 'Synergos.CMS', href: 'https://github.com/CHERCED-DEV/Synergos.CMS' },
        { label: 'Synergos.UI', href: 'https://github.com/CHERCED-DEV/Synergos.UI' },
        { label: 'Synergos.Fabrica', href: 'https://github.com/CHERCED-DEV/Synergos.Fabrica' },
      ],
    })
    for (const project of projects.filter((item) => item.id !== '12')) {
      expect(project.adrCards, project.id).toBeUndefined()
      expect(project.diagram, project.id).toBeUndefined()
      if (project.id === '13') expect(project.links.repos?.map((repo) => repo.label)).toEqual(['Synergos.Fabrica'])
      else expect(project.links.repos, project.id).toBeUndefined()
    }
  })

  it('los diagramas nuevos son SVG propios de 960 × 640, accesibles y sin recursos externos (T407)', () => {
    for (const id of ['13', '14', '15']) {
      const project = projects.find((item) => item.id === id)!
      expect(project.image.src).toMatch(/^\/assets\/imgs\/projects\/[a-z-]+\.svg$/)
      expect([project.image.width, project.image.height]).toEqual([960, 640])
      const svg = readFileSync(join(process.cwd(), 'public', project.image.src), 'utf8')
      expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="960" height="640" viewBox="0 0 960 640" role="img"/)
      expect(svg).toMatch(/<title id="[^"]+">[^<]+<\/title>/)
      expect(svg).toMatch(/<desc id="[^"]+">[^<]+<\/desc>/)
      expect(svg).not.toMatch(/<script|<image|<foreignObject|on\w+=|xlink:href|href="http/i)
    }
  })
})

describe('servicios (E-05, FR-406c)', () => {
  const { services } = site

  it('trae los seis servicios en orden, con "para quién" y entregables', () => {
    expect(services.items.map((item) => item.id)).toEqual([...SERVICE_IDS])
    for (const item of services.items) {
      filled(item.title, `${item.id}.title`)
      filled(item.description, `${item.id}.description`)
      filled(item.forWho, `${item.id}.forWho`)
      expect(item.deliverables.length, item.id).toBeGreaterThanOrEqual(3)
      for (const [index, deliverable] of item.deliverables.entries()) filled(deliverable, `${item.id}.deliverables[${index}]`)
      expect(item.priceRange, `${item.id}: P-421`).toBeUndefined()
    }
    expect(services.items.filter((item) => item.example).map((item) => item.id)).toEqual(['ai-harness', 'software-factory'])
    expect(services.items.at(-1)?.forWho).toEqual({ es: 'Equipos de ingeniería', en: 'Engineering teams' })
  })

  it('arma los bloques de la página: hero, para quién, proceso, preguntas y CTA', () => {
    expect(services.intro).toEqual(services.hero.intro)
    expect(services.hero.title.es).toBe('TU OFICIO, CON UN EQUIPO DE AGENTES A LA MEDIDA')
    expect(services.audiences.map((audience) => audience.id)).toEqual(['professionals', 'companies', 'engineering-teams'])
    expect(services.process.steps).toHaveLength(5)
    expect(services.process.principles).toHaveLength(4)
    expect(services.faq).toHaveLength(4)
    for (const faq of services.faq) expect(faq.q.es).not.toMatch(/dueño/i)
    filled(services.cta.title, 'cta.title')
    filled(services.cta.button, 'cta.button')
  })

  it('valida un id de servicio sin aceptar valores desconocidos', () => {
    for (const id of SERVICE_IDS) expect(isServiceId(id)).toBe(true)
    for (const value of ['design', 'other', '', 'AI-HARNESS', 'ai-harness ', null, 3]) expect(isServiceId(value)).toBe(false)
  })
})

describe('Lo que sé: principios y "en palabras" (E-07)', () => {
  it('las claves de inWords existen en los lóbulos de T229', () => {
    const ids = lobes.map((lobe) => lobe.id)
    expect(ids).toEqual(['frontend', 'architecture', 'backend-cloud', 'applied-ai', 'practices', 'business'])
    expect(Object.keys(site.about.skills.inWords ?? {})).toEqual(['frontend', 'backend-cloud', 'applied-ai'])
    for (const key of Object.keys(site.about.skills.inWords ?? {})) expect(ids).toContain(key)
  })

  it('cada lóbulo tiene un párrafo salvo Prácticas de ingeniería (P-424)', () => {
    const withWords = lobes.filter((lobe) => lobeWords(lobe) !== null).map((lobe) => lobe.id)
    expect(withWords).toEqual(['frontend', 'architecture', 'backend-cloud', 'applied-ai', 'business'])
    expect(lobeWords(lobes.find((lobe) => lobe.id === 'frontend')!)?.es).toMatch(/^Angular es mi casa desde 2022\./)
    expect(lobeWords(lobes.find((lobe) => lobe.id === 'architecture')!)).toEqual(lobes.find((lobe) => lobe.id === 'architecture')!.words)
    expect(lobeWords(lobes.find((lobe) => lobe.id === 'practices')!)).toBeNull()
  })

  it('trae los cinco principios de §8.6', () => {
    expect(site.about.principles?.map((principle) => principle.short.es)).toEqual([
      'Atomicidad',
      'Convenciones que rompen el build',
      'Gates que se prueban fallando',
      'Especificación antes que código',
      'Código para humanos',
    ])
  })
})

describe('terminal (E-10)', () => {
  it('trae los comandos de §15 y §15b', () => {
    expect(terminalCommands.map((command) => command.name)).toEqual([
      'help',
      'whoami',
      'cat principles.md',
      'cat lemas.md',
      'ls projects/',
      'ls synergos/',
      'git log --oneline -1',
      'clear',
    ])
  })

  it('compara sin distinguir mayúsculas y corta la entrada a 80 caracteres', () => {
    expect(findTerminalCommand('  WHOAMI ')?.name).toBe('whoami')
    expect(findTerminalCommand(`whoami${' '.repeat(TERMINAL_MAX_INPUT)}x`)?.name).toBe('whoami')
    const long = runTerminal(`<b>${'x'.repeat(200)}`, 'es')
    expect(long.kind).toBe('unknown')
    if (long.kind === 'unknown') {
      expect(long.lines[0]?.text).toBe(`comando no encontrado: <b>${'x'.repeat(TERMINAL_MAX_INPUT - 3)}. Prueba con help`)
    }
    expect(runTerminal('sudo rm -rf /', 'en')).toEqual({ kind: 'unknown', lines: [{ text: 'command not found: sudo rm -rf /. Try help' }] })
  })

  it('Tab completa solo con un prefijo único', () => {
    expect(completeTerminalInput('who')).toBe('whoami')
    expect(completeTerminalInput('GIT')).toBe('git log --oneline -1')
    expect(completeTerminalInput('ls')).toBeNull()
    expect(completeTerminalInput('cat')).toBeNull()
    expect(completeTerminalInput('')).toBeNull()
    expect(completeTerminalInput('zzz')).toBeNull()
  })

  it('genera ls projects/ en el orden del portafolio con enlace a cada caso', () => {
    expect(Object.keys(projectSlugs).sort()).toEqual(projects.map((project) => project.id).sort())
    const result = runTerminal('ls projects/', 'en')
    expect(result.kind).toBe('output')
    if (result.kind !== 'output') return
    expect(result.lines.map((line) => line.text)).toEqual([
      'synergos/',
      'director-and-lines/',
      'cherced-world-2026/',
      'legal-workspace/',
      'event-bridge/',
      'quantic-theatrum/',
      'airline/',
      'newman-club/',
      'centribal/',
      'my-website/',
      'e-shop/',
      'get-it-done/',
      'studio-ghibli-tracking-system/',
      'studio-ghibli-backoffice/',
      'bookingui-system/',
    ])
    expect(result.lines[0]?.href).toBe('/en/portfolio/12')
  })

  it('cat lemas.md marca en latín solo "Veni, vidi, vici" y cat principles.md numera los cinco', () => {
    expect(runTerminal('cat lemas.md', 'es')).toEqual({
      kind: 'output',
      lines: [{ text: '1. Siembra bondad, cosecha excelencia.' }, { text: '2. Veni, vidi, vici.', lang: 'la' }],
    })
    const principles = runTerminal('cat principles.md', 'en')
    expect(principles.kind === 'output' ? principles.lines.map((line) => line.text) : []).toEqual([
      '1. Atomicity: a piece can reject on its own and owns its store.',
      "2. A convention that doesn't break the build doesn't exist.",
      "3. A gate that never failed isn't watching anything.",
      '4. Spec before code.',
      '5. Code for humans to read, even when an agent writes it.',
    ])
    expect(runTerminal('clear', 'es')).toEqual({ kind: 'clear' })
    expect(runTerminal('whoami', 'es')).toEqual({
      kind: 'output',
      lines: [{ text: 'arquitecto · padre adoptivo de 20 capacidades · sobrino del tío Bob' }],
    })
  })
})

describe('/now (E-12, FR-490)', () => {
  it('trae los cinco bloques llenos, con fecha y sin la fecha de HYROX', () => {
    expect(now.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    for (const block of ['building', 'learning', 'preparing', 'offKeyboard', 'mottos'] as const) {
      expect(now[block].length, block).toBeGreaterThan(0)
      for (const entry of now[block]) for (const lang of ['es', 'en'] as const) expect(entry[lang].trim()).not.toBe('')
    }
    const hyrox = now.preparing.map((entry) => `${entry.es} ${entry.en}`).join(' ')
    expect(hyrox).toContain('HYROX Río de Janeiro')
    expect(hyrox).toContain('HYROX Rio de Janeiro')
    expect(hyrox).not.toMatch(/\b20\d\d\b|\b\d{1,2}\s+de\s+[a-z]+|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d/i)
    expect(now.mottos.filter((motto) => motto.lang === 'la').map((motto) => motto.es)).toEqual(['Veni, vidi, vici.'])
  })
})

describe('perfil, correo y sitemap', () => {
  it('expone el correo público desde las redes', () => {
    expect(publicEmail()).toBe('chernandezcediel@gmail.com')
  })

  it('el sitemap suma /now y los 15 casos en ambos idiomas (FR-472)', async () => {
    const { default: sitemap } = await import('@/app/sitemap')
    const urls = (await sitemap()).map((entry) => new URL(entry.url).pathname)
    for (const lang of ['es', 'en']) {
      expect(urls).toContain(`/${lang}/now`)
      for (const project of projects) expect(urls).toContain(`/${lang}/portfolio/${project.id}`)
    }
  })
})
