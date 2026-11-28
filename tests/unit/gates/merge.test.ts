import { describe, expect, it } from 'vitest'
import { blockers, counted, mergeFindings, toFix } from '@/lib/ai/gates/merge'
import type { ReviewFinding } from '@/lib/ai/gates/schema'
import { finding, SPEC } from './fixtures'

function item(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return { criterion: 'verificable', gravity: 'importante', where: 'C-2', problem: 'No dice cuánto tarda el correo.', fix: 'Agrega el tiempo máximo.', confidence: 0.7, ...overrides }
}

describe('unión de hallazgos (FR-4607)', () => {
  it('agrupa por criterio y lugar, y marca «visto por los dos» cuando coinciden', () => {
    const { findings } = mergeFindings({
      round: 1,
      spec: SPEC,
      deterministic: [],
      reviews: [
        { seat: 'claude', provider: 'claude', resolved: [], findings: [item({ confidence: 0.6 }), item({ criterion: 'clara', where: 'R-1', gravity: 'menor' })] },
        { seat: 'openai', provider: 'openai', resolved: [], findings: [item({ gravity: 'bloqueante', confidence: 0.9, problem: 'El criterio no dice el plazo.' })] },
      ],
      changed: null,
      previous: null,
    })
    expect(findings).toHaveLength(2)
    const both = findings.find((entry) => entry.where === 'C-2')!
    expect(both).toMatchObject({ criterion: 'verificable', gravity: 'bloqueante', confidence: 0.9, seenByBoth: true, problem: 'El criterio no dice el plazo.', origin: 'revisor' })
    expect(both.reporters.map((reporter) => reporter.seat)).toEqual(['claude', 'openai'])
    expect(findings.find((entry) => entry.where === 'R-1')).toMatchObject({ seenByBoth: false, gravity: 'menor' })
  })

  it('el mismo lugar con otro criterio es otro hallazgo, y dos del mismo revisor no cuentan como «los dos»', () => {
    const { findings } = mergeFindings({
      round: 1,
      spec: SPEC,
      deterministic: [],
      reviews: [{ seat: 'claude', provider: 'claude', resolved: [], findings: [item(), item({ problem: 'otra frase' }), item({ criterion: 'honesta' })] }],
      changed: null,
      previous: null,
    })
    expect(findings.map((entry) => `${entry.criterion}|${entry.where}`).sort()).toEqual(['honesta|C-2', 'verificable|C-2'])
    expect(findings.every((entry) => !entry.seenByBoth)).toBe(true)
  })

  it('descarta antes de mostrar lo que apunta a un R-n o C-n que no existe, y lo anota en la traza', () => {
    const { findings, notes } = mergeFindings({
      round: 1,
      spec: SPEC,
      deterministic: [],
      reviews: [{ seat: 'openai', provider: 'openai', resolved: [], findings: [item({ where: 'R-9' }), item({ where: 'C-7' }), item()] }],
      changed: null,
      previous: null,
    })
    expect(findings.map((entry) => entry.where)).toEqual(['C-2'])
    expect(notes).toEqual([
      { round: 1, kind: 'lugar-inexistente', seat: 'openai', where: 'R-9', detail: null },
      { round: 1, kind: 'lugar-inexistente', seat: 'openai', where: 'C-7', detail: null },
    ])
  })

  it('lo determinista va aparte, sin revisores y con sus reglas; los bloqueantes primero y los ids en orden', () => {
    const { findings } = mergeFindings({
      round: 1,
      spec: SPEC,
      deterministic: [
        { rule: 'coverage.unknown-requirement', criterion: 'verificable', gravity: 'bloqueante', where: 'C-2', problem: 'C-2 cubre R-4, que no existe.', fix: 'Corrige el id.' },
        { rule: 'criterio-sin-requisito', criterion: 'verificable', gravity: 'bloqueante', where: 'C-2', problem: 'C-2 no cubre un requisito que exista.', fix: 'Cubre un R-n.' },
      ],
      reviews: [{ seat: 'claude', provider: 'claude', resolved: [], findings: [item({ gravity: 'menor', where: 'R-2', criterion: 'clara' })] }],
      changed: null,
      previous: null,
    })
    expect(findings.map((entry) => [entry.id, entry.origin, entry.gravity])).toEqual([
      ['H-1', 'determinista', 'bloqueante'],
      ['H-2', 'revisor', 'menor'],
    ])
    expect(findings[0]!.rules).toEqual(['coverage.unknown-requirement', 'criterio-sin-requisito'])
    expect(findings[0]!.reporters).toEqual([])
  })

  it('en una ronda de corrección solo cuenta lo que cambió; lo de la ronda anterior en lugares que no cambiaron se arrastra', () => {
    const previous = [
      finding({ id: 'H-1', where: 'R-1', criterion: 'completa', gravity: 'importante' }),
      finding({ id: 'H-2', where: 'C-1', gravity: 'bloqueante', verification: { result: 'se-cae', reason: 'C-1 sí dice el límite.', seat: 'openai', provider: 'openai' } }),
      finding({ id: 'H-3', where: 'C-2', gravity: 'importante' }),
    ]
    const { findings, notes } = mergeFindings({
      round: 2,
      spec: SPEC,
      deterministic: [],
      reviews: [{ seat: 'claude', provider: 'claude', resolved: [], findings: [item({ where: 'C-2', gravity: 'menor', criterion: 'clara' }), item({ where: 'R-2' })] }],
      changed: ['C-2'],
      previous,
    })
    expect(findings.map((entry) => [entry.where, entry.carried, entry.gravity])).toEqual([
      ['R-1', true, 'importante'],
      ['C-2', false, 'menor'],
    ])
    expect(notes).toEqual([{ round: 2, kind: 'fuera-de-cambio', seat: 'claude', where: 'R-2', detail: null }])
  })

  it('un revisor puede dar por resuelto un hallazgo anterior cuya corrección cayó en otro lugar, y queda anotado', () => {
    const previous = [finding({ id: 'H-1', where: 'R-1', criterion: 'completa', gravity: 'bloqueante' }), finding({ id: 'H-2', where: 'R-2', criterion: 'clara', gravity: 'menor' })]
    const { findings, notes } = mergeFindings({
      round: 2,
      spec: SPEC,
      deterministic: [],
      reviews: [
        { seat: 'claude', provider: 'claude', resolved: ['H-1'], findings: [] },
        { seat: 'openai', provider: 'openai', resolved: [], findings: [] },
      ],
      changed: ['C-1'],
      previous,
    })
    expect(findings.map((entry) => [entry.where, entry.carried])).toEqual([['R-2', true]])
    expect(notes).toEqual([{ round: 2, kind: 'resuelto', seat: 'claude', where: 'R-1', detail: 'H-1' }])
  })

  it('lo que el verificador tumbó no cuenta, pero no se borra', () => {
    const findings = [finding({ gravity: 'bloqueante', verification: { result: 'se-cae', reason: 'El criterio sí lo dice.', seat: 'gemini', provider: 'gemini' } }), finding({ id: 'H-2', gravity: 'importante' })]
    expect(counted(findings)).toHaveLength(1)
    expect(blockers(findings)).toBe(0)
    expect(toFix(findings).map((entry) => entry.id)).toEqual(['H-2'])
    expect(findings).toHaveLength(2)
  })
})
