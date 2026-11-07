import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lineSummary, stateText } from '@/components/site/synergos/model'
import { site } from '@/content/site'
import { synergosShowcase } from '@/content/synergos-showcase'
import { terminalCommands } from '@/content/terminal'
import { getProjects } from '@/lib/content'
import { imageSrc } from '@/lib/content/image'

const ROOT = process.cwd()

type Strings = { es: string[]; en: string[] }

function collect(value: unknown, out: Strings, lang: 'es' | 'en' | null = null): Strings {
  if (typeof value === 'string') {
    if (lang) out[lang].push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collect(item, out, lang)
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) collect(item, out, key === 'es' || key === 'en' ? key : lang)
  }
  return out
}

function dictionaries(lang: 'es' | 'en'): string[] {
  const dir = join(ROOT, 'content', 'i18n', lang)
  return readdirSync(dir).flatMap((file) => Object.values(JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, string>))
}

function posts(lang: 'es' | 'en'): string[] {
  const dir = join(ROOT, 'content', 'posts')
  return readdirSync(dir)
    .map((id) => join(dir, id, `${lang}.mdx`))
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, 'utf8'))
}

const content = collect([site, getProjects(), synergosShowcase.copy], { es: [], en: [] })
const visible = {
  es: [...content.es, ...dictionaries('es'), ...posts('es')],
  en: [...content.en, ...dictionaries('en'), ...posts('en')],
}

describe('sección 1: LinkedIn es un perfil y Synergos es el proyecto insignia (A5, C5)', () => {
  it.each(['es', 'en'] as const)('%s: nadie dice "Ver mi CV en LinkedIn" ni "master product"', (lang) => {
    for (const text of visible[lang]) {
      expect(text).not.toMatch(/CV (en|on) LinkedIn/)
      expect(text).not.toMatch(/master product/i)
    }
  })

  it('el llamado y el título de Synergos', () => {
    expect(synergosShowcase.copy.cta).toEqual({ es: 'Conoce Synergos', en: 'Explore Synergos' })
    expect(synergosShowcase.copy.title).toEqual({ es: 'Synergos, mi proyecto insignia', en: 'Synergos, my flagship project' })
  })
})

describe('sección 2: coherencia (C1 a C7)', () => {
  const recruiters = site.recruiters!

  it('C1: los cuatro roles en el orden del autor, sin "Software Architect" ni liderazgo', () => {
    expect(recruiters.roles.map((role) => role.es)).toEqual([
      'Frontend de alta calidad, con Angular como mi framework favorito y las manos también en el backend.',
      'Full stack con énfasis en el front (.NET + Angular).',
      'AI Engineer: arneses de IA (harness), skills y automatizaciones con agentes.',
      'Apoyo al arquitecto de software: diseño, decisiones técnicas y documentación (ADR).',
    ])
    for (const role of recruiters.roles) {
      expect(role.en.length).toBeGreaterThan(0)
      for (const text of [role.es, role.en]) expect(text).not.toMatch(/Software Architect\b|lider|lead\b|leading|liderazgo|leadership/i)
    }
  })

  it('C2: las fábricas de software van en una línea aparte, sin hablar de liderar', () => {
    expect(recruiters.motivation).toEqual({
      es: 'Me motivan los equipos donde pueda mejorar su fábrica de software o proponer lineamientos, experimentos y plantillas.',
      en: "I'm drawn to teams where I can improve their software factory or propose guidelines, experiments and templates.",
    })
    for (const role of recruiters.roles) expect(role.es).not.toMatch(/fábrica/)
  })

  it('C3: 6 años, el dato del CV, sin "7+" ni "desde 2019"', () => {
    expect(site.about.experienceYears).toBe(6)
    for (const text of [...visible.es, ...visible.en]) {
      expect(text).not.toMatch(/7\+\s*(años|years)/)
      expect(text).not.toMatch(/(construyendo|building) (para|for) la web desde 2019|for the web since 2019/)
    }
  })

  it('C6: ninguna línea de Synergos dice "cerrada"; queda su avance', () => {
    const closed = synergosShowcase.lines.find((line) => line.state === 'closed')!
    expect(stateText(closed, 'es')).toBe(`${closed.done}/${closed.total}`)
    expect(stateText(synergosShowcase.lines[0]!, 'es')).toBe('activa · 102/104')
    for (const lang of ['es', 'en'] as const) expect(lineSummary(synergosShowcase.lines, lang)).not.toMatch(/errada|losed/)
  })

  it('C7: el footer y la terminal hablan español en español; en inglés no cambian', () => {
    const es = JSON.parse(readFileSync(join(ROOT, 'content/i18n/es/common.json'), 'utf8')) as Record<string, string>
    const en = JSON.parse(readFileSync(join(ROOT, 'content/i18n/en/common.json'), 'utf8')) as Record<string, string>
    expect(es['footer.egg']).toBe('Sobrino oficial del tío Bob · SOLID viene de familia.')
    expect(en['footer.egg']).toBe("Officially Uncle Bob's nephew · SOLID runs in the family.")
    const whoami = terminalCommands.find((command) => command.name === 'whoami')
    const output = whoami && 'output' in whoami ? whoami.output : null
    expect(output?.es).toMatch(/sobrino del tío Bob$/)
    expect(output?.en).toMatch(/Uncle Bob's nephew$/)
  })
})

describe('sección 3: lenguaje (L1 a L8)', () => {
  it('L1: "componible" en español, nunca "composable"', () => {
    for (const text of visible.es) expect(text).not.toMatch(/composable/i)
    expect(site.home.subtitle!.es).toMatch(/plataformas componibles/)
  })

  it('L2: en español se traducen los conceptos de los lóbulos y se dejan las tecnologías', () => {
    const label = (id: string) => {
      const tech = site.about.skills.tech.find((item) => item.id === id)!
      return tech.label?.es ?? tech.name
    }
    expect(label('a11y')).toBe('ACCESIBILIDAD · WCAG')
    expect(label('composable-architecture')).toBe('ARQUITECTURA COMPONIBLE')
    expect(label('event-driven')).toBe('ARQUITECTURA ORIENTADA A EVENTOS')
    expect(label('legacy-modernization')).toBe('MODERNIZACIÓN DE LEGADO')
    expect(label('spec-driven-development')).toBe('DESARROLLO GUIADO POR ESPECIFICACIONES')
    for (const id of ['angular', 'dotnet', 'grpc', 'native-federation']) expect(label(id)).toBe(site.about.skills.tech.find((item) => item.id === id)!.name)
    for (const tech of site.about.skills.tech) if (tech.label) expect(tech.label.en, tech.id).toBe(tech.name)
  })

  it('L3: "arnés de IA" con "(harness)" la primera vez, en Servicios y en "Para reclutadores"', () => {
    const service = site.services.items.find((item) => item.id === 'ai-harness')!
    expect(service.description.es).toMatch(/^Construyo un arnés de IA \(harness\)/)
    expect(site.recruiters!.roles[2]!.es).toMatch(/arneses de IA \(harness\)/)
  })

  it('L4: la primera vez, "desarrollo guiado por especificaciones (Spec-Driven Development)"', () => {
    for (const text of visible.es) {
      const first = text.search(/Spec-Driven Development/)
      if (first === -1) continue
      expect(text.slice(Math.max(0, first - 50), first + 24), text.slice(0, 60)).toMatch(/desarrollo guiado por especificaciones \(Spec-Driven Development\)/)
    }
  })

  it('L5: "AI-First" solo en el cargo; en el texto corrido, "AI-first"', () => {
    for (const text of [...visible.es, ...visible.en]) {
      for (const match of text.matchAll(/AI-First/g)) expect(text.slice(Math.max(0, match.index - 11), match.index), text.slice(0, 60)).toBe('Engineer · ')
      for (const match of text.matchAll(/AI-first/g)) expect(text.slice(Math.max(0, match.index - 11), match.index)).not.toBe('Engineer · ')
    }
  })

  it('L6: "B1 (B2 en uso profesional frecuente)" en el pop-up y en el lóbulo', () => {
    const english = { es: 'B1 (B2 en uso profesional frecuente)', en: 'B1 (B2 in regular professional use)' }
    expect(site.recruiters!.english).toEqual(english)
    expect(site.about.languages.find((language) => language.id === 'en')!.level).toEqual(english)
  })

  it('L8: el diagrama de Synergos tiene una imagen por idioma, cada una sin el otro idioma', () => {
    const synergos = getProjects().find((project) => project.id === '12')!
    const words = { es: ['recursos', 'capa de composición', 'cualquier framework web'], en: ['resources', 'composition layer', 'any web framework'] }
    for (const lang of ['es', 'en'] as const) {
      const src = imageSrc(synergos.image, lang)
      expect(src).toBe(`/assets/imgs/projects/synergos-${lang}.svg`)
      const svg = readFileSync(join(ROOT, 'public', src), 'utf8')
      expect(svg).toContain(`lang="${lang}"`)
      for (const word of words[lang]) expect(svg).toContain(`>${word}<`)
      for (const word of words[lang === 'es' ? 'en' : 'es']) expect(svg).not.toContain(word)
    }
    expect(existsSync(join(ROOT, 'public/assets/imgs/projects/synergos.svg'))).toBe(false)
  })
})
