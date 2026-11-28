import { describe, expect, it } from 'vitest'
import { GATE_RUN_CAP_USD, recommend, recommendRun, shouldStop, type StopState } from '@/lib/ai/gates/stop'
import { finding } from './fixtures'

const IMPORTANT = finding({ gravity: 'importante' })
const BLOCKER = finding({ id: 'H-2', gravity: 'bloqueante', where: 'R-1' })
const MINOR = finding({ id: 'H-3', gravity: 'menor', where: 'R-2' })
const KNOCKED = finding({ id: 'H-4', gravity: 'bloqueante', where: 'C-1', verification: { result: 'se-cae', reason: 'C-1 sí lo dice.', seat: 'openai', provider: 'openai' } })

function state(overrides: Partial<StopState> = {}): StopState {
  return { round: 1, findings: [IMPORTANT], previousBlockers: null, spentUsd: 0.01, nextEstimateUsd: 0.02, budgetOk: true, ...overrides }
}

describe('regla de parada (FR-4610, SC-4607)', () => {
  it('sigue cuando quedan importantes, es la ronda 1, hay tope y hay presupuesto', () => {
    expect(shouldStop(state())).toBeNull()
  })

  it('1. limpia: no quedan bloqueantes ni importantes (lo tumbado y lo menor no cuentan)', () => {
    expect(shouldStop(state({ findings: [] }))).toBe('limpia')
    expect(shouldStop(state({ findings: [MINOR, KNOCKED] }))).toBe('limpia')
    expect(shouldStop(state({ findings: [MINOR], round: 2, previousBlockers: 3, spentUsd: 1, budgetOk: false }))).toBe('limpia')
  })

  it('2. dos rondas: ya se hicieron las dos automáticas', () => {
    expect(shouldStop(state({ round: 2, previousBlockers: 0 }))).toBe('dos-rondas')
    expect(shouldStop(state({ round: 2, previousBlockers: 1, findings: [BLOCKER] }))).toBe('dos-rondas')
  })

  it('3. empeoró: la ronda 2 tiene más bloqueantes que la 1, y se dice antes que «dos rondas»', () => {
    expect(shouldStop(state({ round: 2, previousBlockers: 0, findings: [BLOCKER] }))).toBe('empeoro')
    expect(shouldStop(state({ round: 2, previousBlockers: 1, findings: [BLOCKER, finding({ id: 'H-5', gravity: 'bloqueante', where: 'C-2' })] }))).toBe('empeoro')
    expect(shouldStop(state({ round: 2, previousBlockers: 0, findings: [KNOCKED, IMPORTANT] }))).toBe('dos-rondas')
  })

  it(`4. tope de la corrida: lo gastado más el estimado del paso siguiente pasa de ${GATE_RUN_CAP_USD} USD`, () => {
    expect(shouldStop(state({ spentUsd: 0.03, nextEstimateUsd: 0.0201 }))).toBe('tope-corrida')
    expect(shouldStop(state({ spentUsd: 0.03, nextEstimateUsd: 0.02 }))).toBeNull()
  })

  it('5. sin presupuesto: el puerto avisa que no hay presupuesto del mes', () => {
    expect(shouldStop(state({ budgetOk: false }))).toBe('sin-presupuesto')
  })

  it('después de la ronda pedida por la persona, para siempre', () => {
    expect(shouldStop(state({ round: 3, previousBlockers: 0 }))).toBe('ronda-pedida')
    expect(shouldStop(state({ round: 3, previousBlockers: 0, findings: [MINOR] }))).toBe('limpia')
    expect(shouldStop(state({ round: 3, previousBlockers: 0, findings: [BLOCKER] }))).toBe('empeoro')
  })
})

describe('recomendación: una regla del servidor que nunca aprueba (FR-4611)', () => {
  it('lista sin bloqueantes ni importantes, con reservas con importantes, no lista con bloqueantes', () => {
    expect(recommend([])).toBe('lista')
    expect(recommend([MINOR, KNOCKED])).toBe('lista')
    expect(recommend([MINOR, IMPORTANT])).toBe('con-reservas')
    expect(recommend([IMPORTANT, BLOCKER])).toBe('no-lista')
  })

  it('«revisión no disponible», «no es software» o una ronda sin revisar fallan cerradas en «no lista»', () => {
    expect(recommendRun({ findings: [], reviewed: true }, 'revision-no-disponible')).toBe('no-lista')
    expect(recommendRun({ findings: [], reviewed: false }, 'no-es-software')).toBe('no-lista')
    expect(recommendRun({ findings: [], reviewed: false }, 'tope-corrida')).toBe('no-lista')
    expect(recommendRun({ findings: [MINOR], reviewed: true }, 'limpia')).toBe('lista')
    expect(recommendRun({ findings: [IMPORTANT], reviewed: true }, 'dos-rondas')).toBe('con-reservas')
  })
})
