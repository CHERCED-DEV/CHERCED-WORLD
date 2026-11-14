export const INPUT_RATE = 16000

export const OUTPUT_RATE = 24000

const BINARY_CHUNK = 0x2000

export function floatTo16(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const value = Math.max(-1, Math.min(1, input[i] || 0))
    output[i] = value < 0 ? Math.round(value * 0x8000) : Math.round(value * 0x7fff)
  }
  return output
}

export function int16ToFloat(input: Int16Array): Float32Array {
  const output = new Float32Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const value = input[i]
    output[i] = value < 0 ? value / 0x8000 : value / 0x7fff
  }
  return output
}

export function downsample(input: Float32Array, fromRate: number, toRate: number = INPUT_RATE): Float32Array {
  if (!(fromRate > 0) || !(toRate > 0)) throw new RangeError('sample rates must be positive')
  if (fromRate === toRate || input.length === 0) return input.slice()
  const ratio = fromRate / toRate
  const length = Math.max(1, Math.round(input.length / ratio))
  const output = new Float32Array(length)
  if (ratio < 1) {
    for (let i = 0; i < length; i++) {
      const position = i * ratio
      const index = Math.floor(position)
      const next = Math.min(index + 1, input.length - 1)
      const weight = position - index
      output[i] = input[index] * (1 - weight) + input[next] * weight
    }
    return output
  }
  for (let i = 0; i < length; i++) {
    const start = Math.min(Math.floor(i * ratio), input.length - 1)
    const end = Math.max(start + 1, Math.min(Math.floor((i + 1) * ratio), input.length))
    let sum = 0
    for (let j = start; j < end; j++) sum += input[j]
    output[i] = sum / (end - start)
  }
  return output
}

export function int16ToBase64(input: Int16Array): string {
  const bytes = new Uint8Array(input.length * 2)
  for (let i = 0; i < input.length; i++) {
    bytes[i * 2] = input[i] & 0xff
    bytes[i * 2 + 1] = (input[i] >> 8) & 0xff
  }
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += BINARY_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BINARY_CHUNK))
  }
  return btoa(binary)
}

export function base64ToInt16(data: string): Int16Array {
  const binary = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
  const output = new Int16Array(binary.length >> 1)
  for (let i = 0; i < output.length; i++) {
    output[i] = (binary.charCodeAt(i * 2 + 1) << 8) | binary.charCodeAt(i * 2)
  }
  return output
}

export function rms(input: Float32Array | Int16Array): number {
  if (input.length === 0) return 0
  const scale = input instanceof Int16Array ? 0x8000 : 1
  let sum = 0
  for (let i = 0; i < input.length; i++) {
    const value = input[i] / scale
    sum += value * value
  }
  const level = Math.sqrt(sum / input.length)
  return Number.isFinite(level) ? Math.min(1, level) : 0
}
