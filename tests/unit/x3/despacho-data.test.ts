import { describe, expect, it } from 'vitest'
import {
  DESPACHO_CASE,
  DESPACHO_CERTAINTIES,
  DESPACHO_EVIDENCE_IDS,
  DESPACHO_FACT_STATUSES,
  DESPACHO_RELATIONS,
  despachoEvidence,
} from '@/content/ailab/showcases/despacho'
import type { Localized } from '@/content/types'

function localized(value: unknown): value is Localized {
  return Boolean(value && typeof value === 'object' && 'es' in value && 'en' in value)
}

function texts(value: unknown): Localized[] {
  if (localized(value)) return [value]
  if (Array.isArray(value)) return value.flatMap(texts)
  if (value && typeof value === 'object') return Object.values(value).flatMap(texts)
  return []
}

describe('el caso del despacho es ficticio, corto y coherente (T742, US9 escenario 1)', () => {
  it('se declara ficticio y dice que todo es inventado, en ES y EN', () => {
    expect(DESPACHO_CASE.fictional).toBe(true)
    expect(DESPACHO_CASE.title.es).toMatch(/^Caso ficticio:/)
    expect(DESPACHO_CASE.title.en).toMatch(/^Fictional case:/)
    expect(DESPACHO_CASE.summary.es).toMatch(/son inventados\.$/)
    expect(DESPACHO_CASE.summary.en).toMatch(/are made up\.$/)
  })

  it('todo el texto existe en los dos idiomas', () => {
    const all = texts(DESPACHO_CASE)
    expect(all.length).toBeGreaterThan(40)
    for (const text of all) {
      expect(text.es.trim()).not.toBe('')
      expect(text.en.trim()).not.toBe('')
    }
  })

  it('es corto: ocho piezas, cinco hechos y nueve momentos', () => {
    expect(DESPACHO_CASE.evidence.map((item) => item.id)).toEqual([...DESPACHO_EVIDENCE_IDS])
    expect(DESPACHO_CASE.facts).toHaveLength(5)
    expect(DESPACHO_CASE.timeline).toHaveLength(9)
  })

  it('no nombra personas: habla de roles', () => {
    const corpus = texts(DESPACHO_CASE)
      .flatMap((text) => [text.es, text.en])
      .join('\n')
    expect(corpus).not.toMatch(/\b(señora|señor|sr\.|sra\.|mr\.|mrs\.|ms\.)\s+[A-ZÁÉÍÓÚÑ]/i)
    expect(corpus).not.toMatch(/\bS\.A\.S\b|\bLtda\b|\bInc\b|\bLLC\b/)
  })
})

describe('hechos con su prueba (método hechos-con-prueba)', () => {
  it('cada hecho cita piezas que existen, con una relación conocida', () => {
    for (const fact of DESPACHO_CASE.facts) {
      expect(DESPACHO_FACT_STATUSES, fact.id).toContain(fact.status)
      expect(fact.links.length, fact.id).toBeGreaterThan(0)
      for (const link of fact.links) {
        expect(DESPACHO_RELATIONS, fact.id).toContain(link.relation)
        expect(despachoEvidence(link.evidence).id).toBe(link.evidence)
      }
    }
    expect(() => despachoEvidence('P9' as never)).toThrow()
  })

  it('el estado de cada hecho es coherente con su prueba', () => {
    for (const fact of DESPACHO_CASE.facts) {
      const relations = fact.links.map((link) => link.relation)
      if (fact.status === 'disputed') expect(relations, fact.id).toContain('contradicts')
      if (fact.status === 'supported') expect(relations, fact.id).not.toContain('contradicts')
      if (fact.status === 'onlySaid') {
        expect(fact.links.every((link) => link.evidence === 'P8'), fact.id).toBe(true)
        expect(fact.missing, fact.id).toBeDefined()
      }
    }
    expect(new Set(DESPACHO_CASE.facts.map((fact) => fact.status))).toEqual(new Set(DESPACHO_FACT_STATUSES))
  })
})

describe('cronología con su grado de certeza (método cronologia)', () => {
  it('va en orden y cada fecha dice de dónde sale', () => {
    const keys = DESPACHO_CASE.timeline.map((entry) => entry.sortKey)
    expect(keys).toEqual([...keys].sort())
    for (const entry of DESPACHO_CASE.timeline) {
      if (entry.kind === 'gap') continue
      expect(DESPACHO_CERTAINTIES, entry.id).toContain(entry.certainty)
      expect(entry.sources.length, entry.id).toBeGreaterThan(0)
      for (const source of entry.sources) expect(despachoEvidence(source).id).toBe(source)
      if (entry.certainty !== 'documented') expect(entry.note, `${entry.id} explica su certeza`).toBeDefined()
    }
  })

  it('muestra los cinco grados de certeza, un conflicto sin resolver y un silencio del material', () => {
    const events = DESPACHO_CASE.timeline.flatMap((entry) => (entry.kind === 'event' ? [entry] : []))
    expect(new Set(events.map((entry) => entry.certainty))).toEqual(new Set(DESPACHO_CERTAINTIES))
    expect(DESPACHO_CASE.timeline.filter((entry) => entry.kind === 'gap')).toHaveLength(1)
    const conflict = events.find((entry) => entry.certainty === 'conflict')!
    expect(conflict.sources.length).toBeGreaterThanOrEqual(2)
    expect(conflict.note?.es).toMatch(/no le toca al método/)
  })

  it('cada pieza del material se usa en un hecho o en la cronología', () => {
    const used = new Set([
      ...DESPACHO_CASE.facts.flatMap((fact) => fact.links.map((link) => link.evidence)),
      ...DESPACHO_CASE.timeline.flatMap((entry) => (entry.kind === 'event' ? entry.sources : [])),
    ])
    expect([...used].sort()).toEqual([...DESPACHO_EVIDENCE_IDS])
  })
})
