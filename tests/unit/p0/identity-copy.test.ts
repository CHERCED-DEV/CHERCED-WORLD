import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { now } from '@/content/now'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import type { Localized } from '@/content/types'

const I18N = join(process.cwd(), 'content', 'i18n')

const OLD_IDENTITY: RegExp[] = [
  /\bfront-?end\s+(web\s+)?developer\b/i,
  /\bfull-?stack\s+(web\s+)?developer\b/i,
  /\bdesarrollador(a)?\s+(web\s+)?(front-?end|full-?stack)\b/i,
  /\bfront-?end\s+(y|and)\s+full-?stack\b/i,
  /\bsoy\s+desarrollador\s+front/i,
  /\bI'?m\s+a\s+front-?end\b/i,
]

function strings(value: unknown, at: string): Array<{ at: string; text: string }> {
  if (typeof value === 'string') return [{ at, text: value }]
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${at}[${index}]`))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => strings(item, `${at}.${key}`))
  return []
}

function dictionaries(): Array<{ at: string; text: string }> {
  return ['es', 'en'].flatMap((lang) =>
    readdirSync(join(I18N, lang)).flatMap((file) => {
      const dict = JSON.parse(readFileSync(join(I18N, lang, file), 'utf8')) as Record<string, string>
      return Object.entries(dict).map(([key, text]) => ({ at: `${lang}/${file}: ${key}`, text }))
    }),
  )
}

const CURRENT_TEXTS = [
  ...strings(site.home, 'home'),
  ...strings(site.profile, 'profile'),
  ...strings(site.about.description, 'about.description'),
  ...strings(site.about.skills.inWords, 'skills.inWords'),
  ...strings(site.about.principles, 'principles'),
  ...strings(site.services, 'services'),
  ...strings(site.portfolio, 'portfolio'),
  ...strings(site.contact, 'contact'),
  ...strings(now, 'now'),
  ...projects.filter((project) => project.era !== '2022-2023').flatMap((project) => strings(project, `project ${project.id}`)),
]

describe('identidad de hoy (SC-401, FR-403)', () => {
  it('ninguna meta description ni texto de los diccionarios presenta al autor como front-end o full-stack developer', () => {
    const texts = dictionaries()
    expect(texts.length).toBeGreaterThan(300)
    for (const { at, text } of texts) {
      for (const pattern of OLD_IDENTITY) expect(text, at).not.toMatch(pattern)
    }
  })

  it('ningún texto vigente del contenido lo hace (la frase tachada, la carrera y 2022–2023 son historia)', () => {
    expect(CURRENT_TEXTS.length).toBeGreaterThan(100)
    for (const { at, text } of CURRENT_TEXTS) {
      for (const pattern of OLD_IDENTITY) expect(text, at).not.toMatch(pattern)
    }
  })

  it('las meta descriptions son las de contenido.md §1, con las enmiendas de la 008 (FR-820) y de R2.3 de la 012, en ES y EN', () => {
    const read = (lang: string, ns: string) =>
      JSON.parse(readFileSync(join(I18N, lang, `${ns}.json`), 'utf8')) as Record<string, string>
    const expected: Record<string, Localized> = {
      'common:meta.description': {
        es: 'Camilo Hernández (CHERCED), Software Solutions Engineer y AI Engineer en Armenia, Colombia: Angular, microservicios .NET y Azure. Fundador de Synergos Labs.',
        en: 'Camilo Hernández (CHERCED), Software Solutions Engineer and AI Engineer in Armenia, Colombia: Angular, .NET microservices and Azure. Founder of Synergos Labs.',
      },
      'site:meta.about.description': {
        es: 'Camilo Hernández (CHERCED), Software Solutions Engineer · AI-First en Armenia, Colombia: mi carrera en aerolíneas y fintech, Synergos Labs y mi CV en PDF.',
        en: 'Camilo Hernández (CHERCED), Software Solutions Engineer · AI-First in Armenia, Colombia: my career in airlines and fintech, Synergos Labs and my CV in PDF.',
      },
      'contact:meta.contact.description': {
        es: 'Escríbeme: te respondo en menos de 48 horas. Aquí también están mi CV en PDF y mi LinkedIn.',
        en: "Write to me: I'll reply within 48 hours. My CV in PDF and my LinkedIn are here too.",
      },
    }
    for (const [id, value] of Object.entries(expected)) {
      const [ns, key] = id.split(':') as [string, string]
      for (const lang of ['es', 'en'] as const) expect(read(lang, ns)[key], `${lang} ${id}`).toBe(value[lang])
    }
    for (const lang of ['es', 'en'] as const) {
      expect(read(lang, 'site')['meta.home.description']).toBe(read(lang, 'common')['meta.description'])
    }
  })

  it('el hero dice el título de hoy y conserva el de 2023 como título anterior (FR-401, FR-402)', () => {
    expect(site.home.title).toEqual({ es: 'DISEÑO SISTEMAS DE SOFTWARE QUE ESCALAN', en: 'I DESIGN SOFTWARE SYSTEMS THAT SCALE' })
    expect(site.home.previousTitle).toEqual({ es: 'SOY DESARROLLADOR', en: "I'M A DEVELOPER" })
    expect(site.home.subtitle?.es).toMatch(/^Software Solutions Engineer · AI-First\./)
    expect(site.home.subtitle?.en).toMatch(/^Software Solutions Engineer · AI-First\./)
    for (const lang of ['es', 'en'] as const) {
      const dict = JSON.parse(readFileSync(join(I18N, lang, 'site.json'), 'utf8')) as Record<string, string>
      expect(dict['home.title']).toBe(site.home.title[lang])
    }
  })

  it('la intro del portafolio es un solo párrafo (FR-404) y "Quién soy" es la de §6 (FR-407)', () => {
    expect(site.portfolio.intro).toHaveLength(1)
    expect(site.portfolio.intro[0]?.es).toMatch(/^Aquí está mi camino completo\./)
    expect(site.about.description.es).toMatch(/^Soy Camilo, Software Solutions Engineer\. Diseño plataformas/)
    expect(site.about.description.en).toMatch(/^I'm Camilo, a Software Solutions Engineer\. I design platforms/)
  })
})
