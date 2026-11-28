import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { gateRunSchema, reviewFinding, reviewReplyWire, revisionSchema, specBreve, verifierReplyWire, writerReplyWire } from '@/lib/ai/gates/schema'
import { SPEC, run } from './fixtures'

type Json = Record<string, unknown>

function walk(node: unknown, visit: (schema: Json) => void): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit)
    return
  }
  visit(node as Json)
  for (const value of Object.values(node as Json)) walk(value, visit)
}

describe('contrato de la spec breve (FR-4602)', () => {
  it('acepta la forma del plan: título, problema, incluye, no incluye, R-n, C-n con lo que cubren y Q-n con su defecto', () => {
    expect(specBreve.parse(SPEC)).toEqual(SPEC)
  })

  it('exige al menos un «no incluye», un requisito y un criterio que cubra algún R-n', () => {
    expect(specBreve.safeParse({ ...SPEC, excludes: [] }).success).toBe(false)
    expect(specBreve.safeParse({ ...SPEC, requirements: [] }).success).toBe(false)
    expect(specBreve.safeParse({ ...SPEC, criteria: [{ ...SPEC.criteria[0]!, covers: [] }] }).success).toBe(false)
  })

  it('rechaza ids con otra forma y textos más largos que el contrato', () => {
    expect(specBreve.safeParse({ ...SPEC, requirements: [{ id: 'R1', text: 'x' }] }).success).toBe(false)
    expect(specBreve.safeParse({ ...SPEC, criteria: [{ ...SPEC.criteria[0]!, id: 'C-100' }] }).success).toBe(false)
    expect(specBreve.safeParse({ ...SPEC, questions: [{ id: 'P-1', question: '¿?', byDefault: 'no' }] }).success).toBe(false)
    expect(specBreve.safeParse({ ...SPEC, title: 'x'.repeat(121) }).success).toBe(false)
    expect(specBreve.safeParse({ ...SPEC, requirements: Array.from({ length: 13 }, (_, index) => ({ id: `R-${index + 1}`, text: 'algo' })) }).success).toBe(false)
  })
})

describe('contrato de un hallazgo (FR-4606)', () => {
  const valid = { criterion: 'clara', gravity: 'menor', where: 'R-2', problem: '«rápido» es vago.', fix: 'Pon un tiempo con unidad.', confidence: 0.55 }

  it('trae criterio de la rúbrica, gravedad, lugar, problema, corrección y confianza de 0 a 1', () => {
    expect(reviewFinding.parse(valid)).toEqual(valid)
    for (const where of ['C-3', 'Q-1', 'title', 'problem', 'includes', 'excludes']) expect(reviewFinding.safeParse({ ...valid, where }).success, where).toBe(true)
  })

  it('rechaza otra gravedad, otro criterio, un lugar que no es de la spec y una confianza fuera de rango', () => {
    expect(reviewFinding.safeParse({ ...valid, gravity: 'crítica' }).success).toBe(false)
    expect(reviewFinding.safeParse({ ...valid, criterion: 'bonita' }).success).toBe(false)
    expect(reviewFinding.safeParse({ ...valid, where: 'R-100' }).success).toBe(false)
    expect(reviewFinding.safeParse({ ...valid, where: 'apéndice' }).success).toBe(false)
    expect(reviewFinding.safeParse({ ...valid, confidence: 1.2 }).success).toBe(false)
  })

  it('cada revisor devuelve como máximo 8', () => {
    const findings = Array.from({ length: 9 }, () => valid)
    expect(reviewReplyWire.safeParse({ findings, resolved: [] }).success).toBe(false)
    expect(reviewReplyWire.safeParse({ findings: findings.slice(0, 8), resolved: [] }).success).toBe(true)
  })
})

describe('esquemas que viajan por el puerto (043)', () => {
  it.each([
    ['redactor', writerReplyWire],
    ['revisor', reviewReplyWire],
    ['verificador', verifierReplyWire],
  ] as const)('%s: todas las claves son obligatorias y no hay largos de texto que la salida estricta no admita', (_name, schema) => {
    const json = z.toJSONSchema(schema, { io: 'output', reused: 'inline' })
    walk(json, (node) => {
      if (node.type === 'object' && node.properties) expect(new Set(node.required as string[])).toEqual(new Set(Object.keys(node.properties as Json)))
      expect(node).not.toHaveProperty('maxLength')
      expect(node).not.toHaveProperty('minLength')
    })
  })
})

describe('contrato de revision.json (FR-4616)', () => {
  it('es la corrida más la decisión, con esquema versionado y sin el sello del servidor', () => {
    const { seal: _seal, ...rest } = run()
    const revision = { ...rest, decision: { decision: 'pedir-cambios', comment: 'Falta el tiempo del correo.', at: '2026-11-28T12:03:00.000Z' } }
    expect(revisionSchema.parse(revision)).toEqual(revision)
    expect(revision.schemaVersion).toBe(1)
  })

  it('sin decisión, con el sello o con un comentario de más de 300 caracteres no cumple', () => {
    const { seal: _seal, ...rest } = run()
    expect(revisionSchema.safeParse(rest).success).toBe(false)
    expect(revisionSchema.safeParse({ ...run(), decision: { decision: 'aprobar', comment: null, at: '2026-11-28T12:03:00.000Z' } }).success).toBe(false)
    expect(revisionSchema.safeParse({ ...rest, decision: { decision: 'rechazar', comment: 'x'.repeat(301), at: '2026-11-28T12:03:00.000Z' } }).success).toBe(false)
    expect(revisionSchema.safeParse({ ...rest, decision: { decision: 'archivar', comment: null, at: '2026-11-28T12:03:00.000Z' } }).success).toBe(false)
  })

  it('la corrida valida su propio esquema, y otra versión no', () => {
    expect(gateRunSchema.parse(run())).toEqual(run())
    expect(gateRunSchema.safeParse({ ...run(), schemaVersion: 2 }).success).toBe(false)
    expect(gateRunSchema.safeParse({ ...run(), recommendation: 'aprobada' }).success).toBe(false)
  })
})
