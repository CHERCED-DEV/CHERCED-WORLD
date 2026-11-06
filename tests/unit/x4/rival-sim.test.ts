import { describe, expect, it } from 'vitest'
import { Match } from '@/lib/ailab/games/match'
import { NET_SIZES, createAdam, createNet, netToArrays, seededRandom } from '@/lib/ailab/games/net'
import { createRally } from '@/lib/ailab/games/physics'
import { SENSES, actionFromMove, potential, senses } from '@/lib/ailab/games/policy'
import {
  HIT_REWARD,
  SHAPING,
  createEpisodeBuilder,
  discountedReturns,
  evaluateReturns,
  finishEpisode,
  recordDecision,
  reinforce,
  rewardEvent,
} from '@/lib/ailab/games/rival'
import { meanRate, trainingRun } from '@/lib/ailab/games/sim'

describe('el rival aprende por refuerzo (T752, SC-304)', () => {
  it('REINFORCE con línea base: tras 20 rallies devuelve al menos 30 puntos más que al principio', () => {
    const report: string[] = []
    for (const seed of [1, 2, 3, 4, 5]) {
      const run = trainingRun({ seed, rallies: 20 })
      const first = meanRate(run.curve.slice(0, 3))!
      const last = meanRate(run.curve.slice(-5))!
      report.push(`semilla ${seed}: ${Math.round(run.before * 100)} % → ${Math.round(run.after * 100)} %`)
      expect(run.rallies, `semilla ${seed}`).toBe(20)
      expect(run.before, `semilla ${seed}`).toBeLessThan(0.45)
      expect(run.after - run.before, report.join('; ')).toBeGreaterThanOrEqual(0.3)
      expect(last - first, `curva de la semilla ${seed}`).toBeGreaterThanOrEqual(0.3)
    }
  })

  it('sin entrenar no mejora: la mejora viene del aprendizaje, no del azar de la medición', () => {
    const net = createNet(NET_SIZES, seededRandom(1))
    const a = evaluateReturns(net, { seed: 7 })
    const b = evaluateReturns(net, { seed: 7 })
    expect(a).toBe(b)
    expect(a).toBeLessThan(0.45)
  })

  it('el retorno descontado acumula hacia atrás', () => {
    expect([...discountedReturns([1, 0, 2], 0.5)]).toEqual([1.5, 1, 2])
    expect([...discountedReturns([], 0.9)]).toEqual([])
  })

  it('el episodio premia acercarse a donde va a llegar la bola, y suma el golpe y el fallo', () => {
    const builder = createEpisodeBuilder()
    const input = new Float32Array(SENSES)
    recordDecision(builder, input, 2, -0.5, 1)
    recordDecision(builder, input, 2, -0.3, 1)
    rewardEvent(builder, HIT_REWARD)
    recordDecision(builder, input, 1, -0.9, 0)
    const episode = finishEpisode(builder)!
    expect([...episode.actions]).toEqual([2, 2, 1])
    expect(episode.rewards[0]).toBeCloseTo(SHAPING * 0.2)
    expect(episode.rewards[1]).toBeCloseTo(HIT_REWARD)
    expect(episode.rewards[2]).toBe(0)
    expect(episode.inputs.length).toBe(3 * SENSES)
    expect(finishEpisode(builder)).toBeNull()
  })

  it('el potencial mide la distancia a la llegada cuando la bola viene, y al centro cuando se va', () => {
    const state = createRally(1)
    state.phase = 'play'
    Object.assign(state.ball, { u: 0.5, v: 0.2, du: 0.6, dv: 0 })
    state.paddles.rival.v = 0.2
    expect(potential(state, 'rival')).toBeCloseTo(0)
    state.paddles.rival.v = 0.4
    expect(potential(state, 'rival')).toBeLessThan(-0.5)
    state.ball.du = -0.6
    state.paddles.rival.v = 0.3125
    expect(potential(state, 'rival')).toBeCloseTo(0)
    const view = senses(state, 'rival')
    expect(view[2]).toBe(-1)
    expect(view[1]).toBe(0)
  })

  it('el movimiento se traduce en subir, quedarse o bajar', () => {
    expect(actionFromMove(-0.02)).toBe(0)
    expect(actionFromMove(0.001)).toBe(1)
    expect(actionFromMove(0.02)).toBe(2)
  })

  it('sin muestras no toca los pesos', () => {
    const net = createNet(NET_SIZES, seededRandom(4))
    const before = netToArrays(net)
    expect(reinforce(net, createAdam(net), []).samples).toBe(0)
    expect(netToArrays(net)).toEqual(before)
  })

  it('la partida entrega cada rally con su tasa y su episodio, y el rival recibe chances', () => {
    const net = createNet(NET_SIZES, seededRandom(3))
    const match = new Match({ seed: 3, net, playerDriver: 'coach', learn: true })
    const outcomes = []
    for (let tick = 0; tick < 60 * 60 && outcomes.length < 3; tick += 1) {
      match.tick()
      outcomes.push(...match.takeOutcomes())
    }
    expect(outcomes).toHaveLength(3)
    for (const outcome of outcomes) {
      expect(outcome.chances).toBeGreaterThanOrEqual(outcome.hits)
      if (outcome.chances > 0) expect(outcome.rate).toBeCloseTo(outcome.hits / outcome.chances)
    }
    expect(outcomes.some((outcome) => outcome.episodes.length > 0)).toBe(true)
    expect(match.decisions).toBeGreaterThan(10)
  })
})
