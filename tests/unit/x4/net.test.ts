import { describe, expect, it } from 'vitest'
import {
  NET_SIZES,
  adamFromArrays,
  adamStep,
  adamToArrays,
  backward,
  createAdam,
  createGrads,
  createNet,
  createTrace,
  forward,
  netFromArrays,
  netToArrays,
  sample,
  seededRandom,
  type Net,
} from '@/lib/ailab/games/net'

function crossEntropy(net: Net, input: number[], target: number): number {
  return -Math.log(forward(net, input).probs[target]!)
}

function analytic(net: Net, input: number[], target: number) {
  const trace = forward(net, input)
  const grads = createGrads(net)
  const dLogits = Array.from(trace.probs, (p, j) => p - (j === target ? 1 : 0))
  backward(net, trace, dLogits, grads)
  return grads
}

describe('red propia de dos capas de 16 neuronas (T751, R-704)', () => {
  it('tiene la forma 6 → 16 → 16 → 3 y su salida es una distribución', () => {
    const net = createNet(NET_SIZES, seededRandom(1))
    expect(net.sizes).toEqual([6, 16, 16, 3])
    expect(net.w.map((layer) => layer.length)).toEqual([96, 256, 48])
    expect(net.b.map((layer) => layer.length)).toEqual([16, 16, 3])
    const trace = forward(net, [0.2, -0.4, 1, 0.3, -0.1, 0.5])
    expect(trace.a.map((layer) => layer.length)).toEqual([6, 16, 16, 3])
    expect([...trace.probs].reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 5)
    for (const value of [...trace.a[1]!, ...trace.a[2]!]) expect(Math.abs(value)).toBeLessThanOrEqual(1)
  })

  it('empieza torpe: con pesos al azar elige casi al azar entre subir, quedarse y bajar', () => {
    const net = createNet(NET_SIZES, seededRandom(9))
    const random = seededRandom(4)
    for (let n = 0; n < 20; n += 1) {
      const probs = forward(net, Array.from({ length: 6 }, () => random() * 2 - 1)).probs
      for (const p of probs) expect(p).toBeGreaterThan(0.2)
    }
  })

  it('los gradientes coinciden con el gradiente numérico', () => {
    const net = createNet(NET_SIZES, seededRandom(5), 1)
    const input = [0.3, -0.7, 1, 0.45, -0.2, 0.6]
    const target = 2
    const grads = analytic(net, input, target)
    const epsilon = 1e-3
    const random = seededRandom(17)
    let checked = 0
    for (let l = 0; l < net.w.length; l += 1) {
      for (const [params, gradient] of [
        [net.w[l]!, grads.w[l]!],
        [net.b[l]!, grads.b[l]!],
      ] as const) {
        for (let n = 0; n < 6; n += 1) {
          const index = Math.floor(random() * params.length)
          const original = params[index]!
          params[index] = original + epsilon
          const plus = crossEntropy(net, input, target)
          params[index] = original - epsilon
          const minus = crossEntropy(net, input, target)
          params[index] = original
          const numeric = (plus - minus) / (2 * epsilon)
          expect(gradient[index]!, `capa ${l}, parámetro ${index}`).toBeCloseTo(numeric, 2)
          expect(Math.abs(gradient[index]! - numeric)).toBeLessThanOrEqual(0.02 * Math.max(1, Math.abs(numeric)))
          checked += 1
        }
      }
    }
    expect(checked).toBe(36)
  })

  it('Adam aprende una regla simple: subir si la bola está arriba, bajar si está abajo', () => {
    const net = createNet(NET_SIZES, seededRandom(2))
    const adam = createAdam(net)
    const grads = createGrads(net)
    const trace = createTrace(net)
    const random = seededRandom(3)
    const data = Array.from({ length: 200 }, () => {
      const x = Array.from({ length: 6 }, () => random() * 2 - 1)
      return { x, y: x[1]! < -0.1 ? 0 : x[1]! > 0.1 ? 2 : 1 }
    })
    const accuracy = () => data.filter(({ x, y }) => forward(net, x, trace).probs.indexOf(Math.max(...forward(net, x, trace).probs)) === y).length / data.length
    const before = accuracy()
    for (let epoch = 0; epoch < 60; epoch += 1) {
      grads.w.forEach((layer) => layer.fill(0))
      grads.b.forEach((layer) => layer.fill(0))
      for (const { x, y } of data) {
        forward(net, x, trace)
        backward(net, trace, Array.from(trace.probs, (p, j) => p - (j === y ? 1 : 0)), grads)
      }
      adamStep(net, grads, adam, 0.02, 1 / data.length)
    }
    expect(before).toBeLessThan(0.6)
    expect(accuracy()).toBeGreaterThan(0.9)
  })

  it('se serializa en Float32Array, sobrevive al clon estructurado y rechaza formas o valores inválidos', () => {
    const net = createNet(NET_SIZES, seededRandom(8))
    const adam = createAdam(net)
    adam.t = 12
    adam.m[0]![3] = 0.5
    const stored = structuredClone({ weights: netToArrays(net), optimizer: adamToArrays(adam) })
    const restored = netFromArrays(stored.weights)!
    expect(restored.sizes).toEqual([...NET_SIZES])
    expect(restored.w).toEqual(net.w)
    expect(restored.b).toEqual(net.b)
    expect(forward(restored, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]).probs).toEqual(forward(net, [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]).probs)
    const optimizer = adamFromArrays(stored.optimizer, restored)!
    expect(optimizer.t).toBe(12)
    expect(optimizer.m[0]![3]).toBeCloseTo(0.5)

    expect(netFromArrays(null)).toBeNull()
    expect(netFromArrays(stored.weights.slice(1))).toBeNull()
    expect(netFromArrays([new Float32Array(5), ...stored.weights.slice(1)])).toBeNull()
    expect(netFromArrays([Array.from(stored.weights[0]!), ...stored.weights.slice(1)])).toBeNull()
    const broken = stored.weights.map((layer) => layer.slice())
    broken[2]![0] = Number.NaN
    expect(netFromArrays(broken)).toBeNull()
    expect(adamFromArrays(stored.optimizer.slice(2), restored)).toBeNull()
  })

  it('el azar con semilla es reproducible y el muestreo respeta las probabilidades', () => {
    const a = seededRandom(77)
    const b = seededRandom(77)
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b))
    const random = seededRandom(1)
    const counts = [0, 0, 0]
    for (let n = 0; n < 3000; n += 1) counts[sample([0.2, 0.5, 0.3], random)]! += 1
    expect(counts[0]! / 3000).toBeCloseTo(0.2, 1)
    expect(counts[1]! / 3000).toBeCloseTo(0.5, 1)
  })
})
