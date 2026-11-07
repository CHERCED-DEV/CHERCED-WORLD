import { describe, expect, it } from 'vitest'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { synergosFacts } from '@/content/synergos'
import { architecture, sourceHref } from '@/content/synergos-architecture'

const APPROVED = ['api-gateway', 'bff', 'saga', 'strangler-fig', 'database-per-service', 'retry', 'idempotency', 'anti-corruption-layer', 'cache-aside', 'rate-limiting', 'health-check', 'config-externalizada', 'circuit-breaker', 'event-driven', 'micro-frontends', 'correlation-id', 'contratos-generados', 'reserva-dos-tiempos']
const REPOS = new Set(['Synergos.CMS', 'Synergos.UI', 'Synergos.Fabrica'])

describe('fase 2 de Synergos: contenido aprobado y fuentes (FR-912, FR-913, SC-912)', () => {
  it('publica exactamente los 18 patrones aprobados, sin confundir descartados con aplicados', () => {
    expect(architecture.patterns.map(pattern => pattern.id).sort()).toEqual([...APPROVED].sort())
    expect(new Set(architecture.patterns.map(pattern => pattern.id)).size).toBe(18)
    expect(architecture.patterns.every(pattern => pattern.status !== 'descartado')).toBe(true)
    for (const pattern of architecture.patterns) {
      if (pattern.status === 'parcial') for (const lang of ['es', 'en'] as const) expect(pattern.limitation?.[lang].trim()).toBeTruthy()
      for (const id of pattern.cases) expect(projects.some(project => project.id === id), pattern.id).toBe(true)
    }
  })

  it('cada tema y cada patrón tiene fuentes públicas seguras y los dos idiomas', () => {
    const entries = [...architecture.topics, ...architecture.patterns, ...architecture.decisions, ...architecture.factory.filter(item => item.status === 'hecho')]
    for (const entry of entries) {
      expect(entry.sources.length, entry.id).toBeGreaterThan(0)
      for (const source of entry.sources) {
        expect(REPOS.has(source.repo)).toBe(true)
        expect(source.path).not.toMatch(/(?:^[A-Za-z]:|Desktop|\.\.|^\/|\\)/i)
        const url = new URL(sourceHref(source))
        expect(url.origin).toBe('https://github.com')
        expect(url.pathname).toMatch(/^\/CHERCED-DEV\/Synergos\.(CMS|UI|Fabrica)\/blob\//)
      }
      const texts = Array.isArray(entry.body) ? entry.body : [entry.body]
      for (const text of texts) for (const lang of ['es', 'en'] as const) expect(text[lang].trim(), `${entry.id}/${lang}`).not.toBe('')
    }
  })

  it('separa visión de lo medido y usa el conteo compartido con su fecha', () => {
    expect(architecture.facts).toBe(synergosFacts)
    expect(architecture.facts.countedAt).toBe('2026-11-05')
    expect(architecture.factory.some(item => item.status === 'vision')).toBe(true)
    for (const item of architecture.factory.filter(item => item.status === 'vision')) {
      expect(`${item.body.es} ${item.body.en}`).not.toMatch(/\d/)
    }
  })

  it('no publica nombres de empleadores, rutas privadas ni proveedores de producción (FR-917)', () => {
    const corpus = JSON.stringify(architecture)
    const employers = site.about.career.filter(entry => entry.id !== 'synergos-labs').map(entry => entry.company)
    for (const employer of employers) expect(corpus.toLocaleLowerCase(), employer).not.toContain(employer.toLocaleLowerCase())
    expect(corpus).not.toMatch(/sistecr[eé]dito|Desktop|\.worktrees|MONGODB_INTEGRAL_DB|VERCEL_URL_CORS|C:\\\\Users/i)
  })
})
