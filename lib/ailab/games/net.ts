export const NET_SIZES: readonly number[] = [6, 16, 16, 3]

export type Net = { sizes: number[]; w: Float32Array[]; b: Float32Array[] }

export type Trace = { a: Float32Array[]; probs: Float32Array }

export type Grads = { w: Float32Array[]; b: Float32Array[] }

export type Adam = { m: Float32Array[]; v: Float32Array[]; t: number }

export type Random = () => number

export const ADAM_BETA1 = 0.9

export const ADAM_BETA2 = 0.999

const ADAM_EPSILON = 1e-8

export function seededRandom(seed: number): Random {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function layerCount(net: Pick<Net, 'sizes'>): number {
  return net.sizes.length - 1
}

export function createNet(sizes: readonly number[] = NET_SIZES, random: Random = Math.random, outputScale = 0.1): Net {
  const w: Float32Array[] = []
  const b: Float32Array[] = []
  for (let l = 0; l < sizes.length - 1; l += 1) {
    const inputs = sizes[l]!
    const outputs = sizes[l + 1]!
    const limit = Math.sqrt(6 / (inputs + outputs)) * (l === sizes.length - 2 ? outputScale : 1)
    const weights = new Float32Array(inputs * outputs)
    for (let i = 0; i < weights.length; i += 1) weights[i] = (random() * 2 - 1) * limit
    w.push(weights)
    b.push(new Float32Array(outputs))
  }
  return { sizes: [...sizes], w, b }
}

export function cloneNet(net: Net): Net {
  return { sizes: [...net.sizes], w: net.w.map((layer) => layer.slice()), b: net.b.map((layer) => layer.slice()) }
}

export function createTrace(net: Pick<Net, 'sizes'>): Trace {
  return { a: net.sizes.map((size) => new Float32Array(size)), probs: new Float32Array(net.sizes[net.sizes.length - 1]!) }
}

export function softmax(logits: Float32Array, out: Float32Array = new Float32Array(logits.length)): Float32Array {
  let max = -Infinity
  for (let i = 0; i < logits.length; i += 1) max = Math.max(max, logits[i]!)
  let sum = 0
  for (let i = 0; i < logits.length; i += 1) {
    const value = Math.exp(logits[i]! - max)
    out[i] = value
    sum += value
  }
  for (let i = 0; i < logits.length; i += 1) out[i] = out[i]! / sum
  return out
}

export function forward(net: Net, input: ArrayLike<number>, trace: Trace = createTrace(net)): Trace {
  const layers = layerCount(net)
  const first = trace.a[0]!
  for (let i = 0; i < first.length; i += 1) first[i] = input[i] ?? 0
  for (let l = 0; l < layers; l += 1) {
    const inputs = net.sizes[l]!
    const outputs = net.sizes[l + 1]!
    const from = trace.a[l]!
    const to = trace.a[l + 1]!
    const weights = net.w[l]!
    const bias = net.b[l]!
    const hidden = l < layers - 1
    for (let j = 0; j < outputs; j += 1) {
      let sum = bias[j]!
      const row = j * inputs
      for (let i = 0; i < inputs; i += 1) sum += weights[row + i]! * from[i]!
      to[j] = hidden ? Math.tanh(sum) : sum
    }
  }
  softmax(trace.a[layers]!, trace.probs)
  return trace
}

export function createGrads(net: Pick<Net, 'w' | 'b'>): Grads {
  return { w: net.w.map((layer) => new Float32Array(layer.length)), b: net.b.map((layer) => new Float32Array(layer.length)) }
}

export function zeroGrads(grads: Grads): void {
  for (const layer of grads.w) layer.fill(0)
  for (const layer of grads.b) layer.fill(0)
}

export function backward(net: Net, trace: Trace, dLogits: ArrayLike<number>, grads: Grads, scratch?: Float32Array[]): void {
  const layers = layerCount(net)
  const deltas = scratch ?? net.sizes.map((size) => new Float32Array(size))
  const top = deltas[layers]!
  for (let j = 0; j < top.length; j += 1) top[j] = dLogits[j] ?? 0
  for (let l = layers - 1; l >= 0; l -= 1) {
    const inputs = net.sizes[l]!
    const outputs = net.sizes[l + 1]!
    const from = trace.a[l]!
    const delta = deltas[l + 1]!
    const weights = net.w[l]!
    const gw = grads.w[l]!
    const gb = grads.b[l]!
    const below = deltas[l]!
    below.fill(0)
    for (let j = 0; j < outputs; j += 1) {
      const d = delta[j]!
      if (d === 0) continue
      gb[j] = gb[j]! + d
      const row = j * inputs
      for (let i = 0; i < inputs; i += 1) {
        gw[row + i] = gw[row + i]! + d * from[i]!
        below[i] = below[i]! + d * weights[row + i]!
      }
    }
    if (l > 0) {
      for (let i = 0; i < inputs; i += 1) {
        const a = from[i]!
        below[i] = below[i]! * (1 - a * a)
      }
    }
  }
}

export function createAdam(net: Pick<Net, 'w' | 'b'>): Adam {
  const zeros = [...net.w, ...net.b].map((layer) => new Float32Array(layer.length))
  return { m: zeros, v: zeros.map((layer) => new Float32Array(layer.length)), t: 0 }
}

export function gradNorm(grads: Grads, scale = 1): number {
  let sum = 0
  for (const layer of [...grads.w, ...grads.b]) for (let i = 0; i < layer.length; i += 1) sum += (layer[i]! * scale) ** 2
  return Math.sqrt(sum)
}

export function adamStep(net: Net, grads: Grads, adam: Adam, lr: number, scale = 1, clip = 5): void {
  const norm = gradNorm(grads, scale)
  const factor = norm > clip ? (scale * clip) / norm : scale
  adam.t += 1
  const correction1 = 1 - ADAM_BETA1 ** adam.t
  const correction2 = 1 - ADAM_BETA2 ** adam.t
  const params = [...net.w, ...net.b]
  const gradients = [...grads.w, ...grads.b]
  for (let p = 0; p < params.length; p += 1) {
    const param = params[p]!
    const grad = gradients[p]!
    const m = adam.m[p]!
    const v = adam.v[p]!
    for (let i = 0; i < param.length; i += 1) {
      const g = grad[i]! * factor
      m[i] = ADAM_BETA1 * m[i]! + (1 - ADAM_BETA1) * g
      v[i] = ADAM_BETA2 * v[i]! + (1 - ADAM_BETA2) * g * g
      param[i] = param[i]! - (lr * (m[i]! / correction1)) / (Math.sqrt(v[i]! / correction2) + ADAM_EPSILON)
    }
  }
}

export function argmax(values: ArrayLike<number>): number {
  let best = 0
  for (let i = 1; i < values.length; i += 1) if (values[i]! > values[best]!) best = i
  return best
}

export function sample(probs: ArrayLike<number>, random: Random): number {
  const roll = random()
  let sum = 0
  for (let i = 0; i < probs.length; i += 1) {
    sum += probs[i]!
    if (roll < sum) return i
  }
  return probs.length - 1
}

export function netToArrays(net: Net): Float32Array[] {
  return net.w.flatMap((layer, index) => [layer.slice(), net.b[index]!.slice()])
}

export function adamToArrays(adam: Adam): Float32Array[] {
  return [...adam.m.map((layer) => layer.slice()), ...adam.v.map((layer) => layer.slice()), Float32Array.of(adam.t)]
}

function finite(array: Float32Array): boolean {
  for (let i = 0; i < array.length; i += 1) if (!Number.isFinite(array[i]!)) return false
  return true
}

function isFloat32(value: unknown): value is Float32Array {
  return value instanceof Float32Array || Object.prototype.toString.call(value) === '[object Float32Array]'
}

export function netFromArrays(arrays: unknown, sizes: readonly number[] = NET_SIZES): Net | null {
  if (!Array.isArray(arrays) || arrays.length !== (sizes.length - 1) * 2) return null
  const w: Float32Array[] = []
  const b: Float32Array[] = []
  for (let l = 0; l < sizes.length - 1; l += 1) {
    const weights: unknown = arrays[l * 2]
    const bias: unknown = arrays[l * 2 + 1]
    if (!isFloat32(weights) || !isFloat32(bias)) return null
    if (weights.length !== sizes[l]! * sizes[l + 1]! || bias.length !== sizes[l + 1]!) return null
    if (!finite(weights) || !finite(bias)) return null
    w.push(new Float32Array(weights))
    b.push(new Float32Array(bias))
  }
  return { sizes: [...sizes], w, b }
}

export function adamFromArrays(arrays: unknown, net: Net): Adam | null {
  const count = net.w.length + net.b.length
  if (!Array.isArray(arrays) || arrays.length !== count * 2 + 1) return null
  const shapes = [...net.w, ...net.b].map((layer) => layer.length)
  const m: Float32Array[] = []
  const v: Float32Array[] = []
  for (let p = 0; p < count; p += 1) {
    const first: unknown = arrays[p]
    const second: unknown = arrays[count + p]
    if (!isFloat32(first) || !isFloat32(second) || first.length !== shapes[p] || second.length !== shapes[p]) return null
    if (!finite(first) || !finite(second)) return null
    m.push(new Float32Array(first))
    v.push(new Float32Array(second))
  }
  const steps: unknown = arrays[count * 2]
  if (!isFloat32(steps) || steps.length !== 1 || !Number.isFinite(steps[0]!) || steps[0]! < 0) return null
  return { m, v, t: Math.round(steps[0]!) }
}
