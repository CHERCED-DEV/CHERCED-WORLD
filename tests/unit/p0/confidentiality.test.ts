import { describe, expect, it } from 'vitest'
import { now } from '@/content/now'
import { projects } from '@/content/projects'
import { site } from '@/content/site'

const EMPLOYER = /sistecr[eé]dito/i

function quantities(text: string): string[] {
  const found = [
    ...text.matchAll(/\d[\d.,]*\s?[+%]/g),
    ...text.matchAll(/[~≈]\s?\d/g),
    ...text.matchAll(/(?<![\w.])\d{2,}(?![\w])/g),
  ]
  return found.map((match) => match[0])
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

const employerEntries = site.about.career.filter((entry) => EMPLOYER.test(entry.company))
const eventBridge = projects.find((project) => project.id === '15')!

describe('confidencialidad (FR-444, SC-407)', () => {
  it('la regla detecta las cantidades que tiene que bloquear', () => {
    for (const sample of ['más de 700 asesores', '90 % del tráfico', '~1.000 eventos', '3+ equipos', '≈ 5 s', 'en 2026']) {
      expect(quantities(sample), sample).not.toEqual([])
    }
    for (const sample of ['GA4 y GTM', 'AWS → Azure', '.NET y C#', 'una sola vez']) expect(quantities(sample), sample).toEqual([])
  })

  it('las entradas del empleador actual no traen cantidades', () => {
    expect(employerEntries).toHaveLength(2)
    for (const entry of employerEntries) {
      for (const lang of ['es', 'en'] as const) expect(quantities(entry.description[lang]), `${entry.id}.${lang}`).toEqual([])
    }
  })

  it('el caso Event bridge no trae cantidades ni enlaces', () => {
    const { title, summary, context, role, decisions, result, highlights, technologies, image } = eventBridge
    const texts = strings({ title, summary, context, role, decisions, result, highlights, technologies, alt: image.alt })
    expect(texts.length).toBeGreaterThan(10)
    for (const text of texts) expect(quantities(text), text).toEqual([])
    expect(eventBridge.links).toEqual({ live: null, github: null })
  })

  it('ningún caso, servicio ni texto de /now nombra al empleador', () => {
    for (const text of [...strings(projects), ...strings(site.services), ...strings(now), ...strings(site.profile)]) {
      expect(text).not.toMatch(EMPLOYER)
    }
  })

  it('los casos nuevos van sin enlaces hasta que el autor los confirme (FR-447, P-420)', () => {
    for (const id of ['13', '14', '15']) {
      const project = projects.find((item) => item.id === id)!
      expect(project.links, id).toEqual({ live: null, github: null })
    }
  })
})
