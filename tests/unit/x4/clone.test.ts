import { describe, expect, it } from 'vitest'
import {
  CLONE_MAX_SAMPLES,
  agreement,
  classWeights,
  createDemoRecorder,
  demoFromRecorder,
  imitate,
  recordMove,
  recordedSamples,
  resetRecorder,
  splitDemo,
} from '@/lib/ailab/games/clone'
import { NET_SIZES, createAdam, createNet, seededRandom } from '@/lib/ailab/games/net'
import { COURT, createRally } from '@/lib/ailab/games/physics'
import { SENSES } from '@/lib/ailab/games/policy'
import { STYLES, cloneRun } from '@/lib/ailab/games/sim'

describe('el clon aprende por imitación (T754, US7)', () => {
  it('graba pares de lo que vio y cómo te moviste, solo durante el juego', () => {
    const recorder = createDemoRecorder()
    const state = createRally(1)
    recordMove(recorder, state)
    expect(recordedSamples(recorder)).toBe(0)
    state.phase = 'play'
    Object.assign(state.ball, { u: 0.5, v: 0.2, du: -0.6, dv: 0 })
    recordMove(recorder, state)
    state.paddles.player.v -= 0.02
    recordMove(recorder, state)
    state.paddles.player.v += 0.0001
    recordMove(recorder, state)
    expect(recordedSamples(recorder)).toBe(2)
    const demo = demoFromRecorder(recorder)
    expect([...demo.actions]).toEqual([0, 1])
    expect(demo.inputs.length).toBe(2 * SENSES)
    expect(demo.inputs[2]).toBe(1)
    resetRecorder(recorder)
    expect(recordedSamples(recorder)).toBe(0)
  })

  it('no guarda más de lo necesario', () => {
    const recorder = createDemoRecorder()
    const state = createRally(1)
    state.phase = 'play'
    Object.assign(state.ball, { u: 0.5, v: 0.2, du: -0.6, dv: 0 })
    for (let n = 0; n < CLONE_MAX_SAMPLES + 50; n += 1) recordMove(recorder, state)
    expect(recordedSamples(recorder)).toBe(CLONE_MAX_SAMPLES)
  })

  it('separa entrenamiento y prueba sin repetir, siempre igual', () => {
    const a = splitDemo(100, 0.2, 3)
    expect(a.test).toHaveLength(20)
    expect(a.train).toHaveLength(80)
    expect(new Set([...a.test, ...a.train]).size).toBe(100)
    expect(splitDemo(100, 0.2, 3)).toEqual(a)
    expect(splitDemo(6, 0.2, 3).test).toEqual([])
  })

  it('compensa que casi siempre te quedas quieto', () => {
    const weights = classWeights(Uint8Array.from([1, 1, 1, 1, 1, 1, 1, 0, 2, 2]))
    expect(weights[0]!).toBeGreaterThan(weights[1]!)
    expect(weights[2]!).toBeGreaterThan(weights[1]!)
  })

  it('imita la tendencia del jugador: el clon de quien juega arriba juega arriba, y el de abajo, abajo', async () => {
    const tops: number[] = []
    const bottoms: number[] = []
    for (const seed of [1, 2, 3, 4]) {
      const top = await cloneRun({ style: STYLES.top, seed })
      const bottom = await cloneRun({ style: STYLES.bottom, seed })
      expect(top.similarity, `arriba, semilla ${seed}`).toBeGreaterThanOrEqual(0.8)
      expect(bottom.similarity, `abajo, semilla ${seed}`).toBeGreaterThanOrEqual(0.8)
      expect(top.humanMean / COURT.width).toBeLessThan(0.3)
      expect(bottom.humanMean / COURT.width).toBeGreaterThan(0.7)
      tops.push(top.cloneMean / COURT.width)
      bottoms.push(bottom.cloneMean / COURT.width)
    }
    expect(Math.max(...tops)).toBeLessThan(Math.min(...bottoms))
    expect(tops.reduce((a, b) => a + b) / tops.length).toBeLessThan(0.42)
    expect(bottoms.reduce((a, b) => a + b) / bottoms.length).toBeGreaterThan(0.6)
  })

  it('el parecido se mide en situaciones que no vio al entrenar, y la curva sube', async () => {
    const recorderRun = await cloneRun({ style: STYLES.chaser, seed: 3 })
    expect(recorderRun.curve[0]!).toBeLessThan(recorderRun.similarity)
    expect(recorderRun.similarity).toBeGreaterThan(0.85)
    expect(recorderRun.curve.length).toBe(25)
  })

  it('un clon sin entrenar no se parece a nadie', async () => {
    const net = createNet(NET_SIZES, seededRandom(4))
    const recorder = createDemoRecorder()
    const state = createRally(1)
    state.phase = 'play'
    Object.assign(state.ball, { u: 0.5, v: 0.1, du: -0.6, dv: 0.1 })
    for (let n = 0; n < 40; n += 1) {
      state.paddles.player.v = 0.3 - n * 0.005
      recordMove(recorder, state)
    }
    const demo = demoFromRecorder(recorder)
    const untrained = agreement(net, demo)
    const result = await imitate(net, createAdam(net), demo)
    expect(result.similarity).toBeGreaterThan(untrained)
  })
})
