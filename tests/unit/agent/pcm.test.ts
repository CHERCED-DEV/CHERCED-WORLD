import { describe, expect, it } from 'vitest'
import {
  base64ToInt16,
  downsample,
  floatTo16,
  INPUT_RATE,
  int16ToBase64,
  int16ToFloat,
  OUTPUT_RATE,
  rms,
} from '@/lib/ai/agent/pcm'

describe('pcm', () => {
  it('expone las tasas del protocolo', () => {
    expect(INPUT_RATE).toBe(16000)
    expect(OUTPUT_RATE).toBe(24000)
  })

  it('convierte float a PCM16 con recorte', () => {
    const pcm = floatTo16(Float32Array.from([0, 1, -1, 1.5, -2, 0.5, -0.5, Number.NaN]))
    expect(Array.from(pcm)).toEqual([0, 32767, -32768, 32767, -32768, 16384, -16384, 0])
  })

  it('convierte PCM16 a float dentro de [-1, 1]', () => {
    const values = int16ToFloat(Int16Array.from([-32768, -16384, 0, 16384, 32767]))
    expect(values[0]).toBe(-1)
    expect(values[1]).toBe(-0.5)
    expect(values[2]).toBe(0)
    expect(values[3]).toBeCloseTo(0.5, 3)
    expect(values[4]).toBe(1)
    expect(values.every((value) => value >= -1 && value <= 1)).toBe(true)
  })

  it('codifica PCM16 a base64 en little-endian', () => {
    const encoded = int16ToBase64(Int16Array.from([0x0102, -1, -32768]))
    expect(Array.from(Buffer.from(encoded, 'base64'))).toEqual([0x02, 0x01, 0xff, 0xff, 0x00, 0x80])
    expect(encoded).toBe(Buffer.from([0x02, 0x01, 0xff, 0xff, 0x00, 0x80]).toString('base64'))
  })

  it('ida y vuelta int16 ↔ base64 conserva negativos y extremos', () => {
    const original = Int16Array.from([0, 1, -1, 258, -258, 32767, -32768, 12345, -12345])
    expect(Array.from(base64ToInt16(int16ToBase64(original)))).toEqual(Array.from(original))
  })

  it('ida y vuelta de un bloque grande no se corta', () => {
    const original = new Int16Array(40000).map((_, index) => ((index * 7919) % 65536) - 32768)
    const decoded = base64ToInt16(int16ToBase64(original))
    expect(decoded.length).toBe(original.length)
    expect(decoded.every((value, index) => value === original[index])).toBe(true)
  })

  it('descarta el último byte cuando la longitud es impar', () => {
    const decoded = base64ToInt16(Buffer.from([0x02, 0x01, 0xff, 0xff, 0x09]).toString('base64'))
    expect(Array.from(decoded)).toEqual([0x0102, -1])
  })

  it('reduce 48 kHz a 16 kHz con la longitud correcta y promediando', () => {
    expect(downsample(new Float32Array(4800), 48000).length).toBe(1600)
    expect(downsample(new Float32Array(4410), 44100, 16000).length).toBe(1600)
    const reduced = downsample(Float32Array.from([0.3, 0.3, 0.3, 0.6, 0.6, 0.6, -1, 0, 1]), 48000, 16000)
    expect(reduced.length).toBe(3)
    expect(reduced[0]).toBeCloseTo(0.3, 5)
    expect(reduced[1]).toBeCloseTo(0.6, 5)
    expect(reduced[2]).toBeCloseTo(0, 5)
  })

  it('devuelve una copia cuando las tasas son iguales', () => {
    const input = Float32Array.from([0.1, -0.2, 0.3])
    const output = downsample(input, 16000)
    expect(output).not.toBe(input)
    expect(Array.from(output)).toEqual(Array.from(input))
  })

  it('interpola cuando la tasa de origen es menor', () => {
    const output = downsample(Float32Array.from([0, 1]), 8000, 16000)
    expect(output.length).toBe(4)
    expect(output[0]).toBe(0)
    expect(output[1]).toBeCloseTo(0.5, 5)
  })

  it('mide rms 0 en silencio y ≈1 con onda cuadrada a escala completa', () => {
    expect(rms(new Float32Array(160))).toBe(0)
    expect(rms(new Int16Array(160))).toBe(0)
    expect(rms(new Float32Array(0))).toBe(0)
    const square = new Float32Array(160).map((_, index) => (index % 2 === 0 ? 1 : -1))
    expect(rms(square)).toBeCloseTo(1, 5)
    expect(rms(floatTo16(square))).toBeCloseTo(1, 3)
    expect(rms(Float32Array.from([2, -2]))).toBe(1)
  })
})
