import { describe, expect, it } from 'vitest'
import { site } from '@/content/site'

type CareerRow = {
  id: string
  company: string
  role: string
  start: string
  end: string | null
  es?: string[]
  en?: string[]
}

const CAREER: CareerRow[] = [
  {
    id: 'sistecredito-ai-first',
    company: 'Sistecrédito',
    role: 'Software Solutions Engineer · AI-First',
    start: '2026-02',
    end: null,
  },
  {
    id: 'sistecredito-dev-solutions',
    company: 'Sistecrédito',
    role: 'Development Solutions Engineer',
    start: '2025-03',
    end: '2026-02',
  },
  {
    id: 'synergos-labs',
    company: 'Synergos Labs',
    role: 'Founder & Software Architect',
    start: '2024-02',
    end: null,
    es: ['31 piezas desplegables', 'más de 6.600 tests', 'más de 140 decisiones'],
    en: ['31 deployable pieces', '6,600+ automated tests', '140+ documented architecture decisions'],
  },
  {
    id: 'flyr',
    company: 'FLYR',
    role: 'Frontend Web Developer',
    start: '2023-03',
    end: '2025-03',
    es: ['módulo PCI', 'redención de vouchers'],
    en: ['PCI module', 'voucher redemption'],
  },
  {
    id: 'newshore',
    company: 'Newshore (a FLYR Labs company)',
    role: 'Frontend Web Developer',
    start: '2022-07',
    end: '2023-03',
  },
  {
    id: 'platzi-master',
    company: 'Platzi',
    role: 'Frontend Web Developer – Platzi Master [CX]',
    start: '2022-03',
    end: '2022-06',
  },
  {
    id: 'growup-it',
    company: 'Growup IT',
    role: 'Frontend Web Developer',
    start: '2019-01',
    end: '2019-11',
    es: ['portal de pago de impuestos de una entidad pública', 'unos 40 puntos'],
    en: ["public entity's tax-payment portal", 'about 40 points'],
  },
  {
    id: 'squadra-arquitectura',
    company: 'Squadra Arquitectura',
    role: 'Founder & Business Manager',
    start: '2016-10',
    end: '2020-05',
    es: ['habilitación hospitalaria y obra civil'],
    en: ['hospital facility compliance and civil works'],
  },
]

const EDUCATION = [
  { id: 'unad', start: '2020-06', end: '2023-11', es: 'no finalizados', en: 'not completed' },
  { id: 'platzi', start: '2018', end: '2022' },
  { id: 'eam', start: '2013', end: '2017', es: 'graduado con honores, énfasis en Creación de Empresas', en: 'graduated with honors' },
]

describe('carrera contra la tabla de verificación (§7.8, FR-410 a FR-418, SC-402)', () => {
  it('tiene exactamente las entradas de la tabla, en orden', () => {
    expect(site.about.career.map((entry) => entry.id)).toEqual(CAREER.map((row) => row.id))
  })

  it.each(CAREER.map((row) => [row.id, row] as const))('%s: empresa, rol oficial en inglés en ambos idiomas y fechas', (_, row) => {
    const entry = site.about.career.find((item) => item.id === row.id)!
    expect(entry.company).toBe(row.company)
    expect(entry.role).toEqual({ es: row.role, en: row.role })
    expect(entry.start).toBe(row.start)
    expect(entry.end).toBe(row.end)
    for (const fragment of row.es ?? []) expect(entry.description.es).toContain(fragment)
    for (const fragment of row.en ?? []) expect(entry.description.en).toContain(fragment)
  })

  it('Growup IT ya no habla del sitio de una empresa de servicios comerciales (FR-410)', () => {
    const growup = site.about.career.find((entry) => entry.id === 'growup-it')!
    expect(growup.description.es).not.toContain('servicios comerciales')
    expect(growup.description.en).not.toContain('commercial services')
  })

  it('Synergos Labs ya no dice "más de 30 componentes" ni "más de 3 frameworks" (FR-414)', () => {
    const synergos = site.about.career.find((entry) => entry.id === 'synergos-labs')!
    expect(synergos.description.es).not.toMatch(/30 componentes|3 frameworks/)
    expect(synergos.description.en).not.toMatch(/30\+ reusable|3\+ frameworks/)
  })
})

describe('educación, cursos, idiomas y contacto (§7.7, §7.8)', () => {
  it.each(EDUCATION.map((row) => [row.id, row] as const))('%s conserva sus fechas y título', (_, row) => {
    const entry = site.about.education.find((item) => item.id === row.id)!
    expect(entry.start).toBe(row.start)
    expect(entry.end).toBe(row.end)
    if (row.es) expect(entry.degree.es).toContain(row.es)
    if (row.en) expect(entry.degree.en).toContain(row.en)
  })

  it('suma los 140+ cursos certificados en el lugar de "Y otras escuelas" (FR-417)', () => {
    const last = site.about.courses.schools.at(-1)!
    expect(last.name).toEqual({
      es: 'Y más de 140 cursos certificados de desarrollo de software',
      en: 'And 140+ certified software development courses',
    })
    expect(last.description.es.trim()).not.toBe('')
    expect(site.about.courses.schools[0]?.name.es).toContain('nov 2025')
  })

  it('fija idiomas, contacto público y ubicación (FR-418, FR-419)', () => {
    expect(site.about.languages.map((language) => [language.id, language.progress])).toEqual([
      ['es', 100],
      ['en', 65],
    ])
    const href = (id: string) => site.socials.find((social) => social.id === id)?.href
    expect(href('email')).toBe('mailto:chernandezcediel@gmail.com')
    expect(href('linkedin')).toBe('https://www.linkedin.com/in/cherced/')
    expect(href('github')).toBe('https://github.com/CHERCED-DEV')
    expect(site.profile?.availability).toEqual({
      location: { es: 'Armenia, Colombia', en: 'Armenia, Colombia' },
      timezone: 'UTC−5',
      relocation: { es: 'Abierto a reubicación', en: 'Open to relocation' },
    })
  })

  it('el CV es el perfil de LinkedIn, nunca un PDF (FR-420, P-406)', () => {
    expect(site.profile?.cv.href).toBe('https://www.linkedin.com/in/cherced/')
    expect(site.profile?.cv.href).not.toMatch(/\.pdf$/i)
  })
})
