import { describe, expect, it } from 'vitest'
import { SILENCE_LEVEL, WINDOW_SECONDS, durationOf, isSilent, loudestFrame, mixToMono, planWindows } from '@/lib/ailab/voice/audio'
import { SAMPLE_RATE } from '@/lib/ailab/voice/protocol'

function tone(seconds: number, amplitude = 0.3, rate = SAMPLE_RATE): Float32Array {
  const samples = new Float32Array(Math.round(seconds * rate))
  for (let index = 0; index < samples.length; index += 1) samples[index] = amplitude * Math.sin((2 * Math.PI * 220 * index) / rate)
  return samples
}

function withQuiet(samples: Float32Array, from: number, to: number, rate = SAMPLE_RATE): Float32Array {
  const copy = new Float32Array(samples)
  copy.fill(0, Math.round(from * rate), Math.round(to * rate))
  return copy
}

describe('ventanas de 30 s para Whisper (T720)', () => {
  it('un audio corto es una sola ventana', () => {
    expect(planWindows(tone(12))).toEqual([{ start: 0, end: 12 * SAMPLE_RATE }])
    expect(planWindows(new Float32Array(0))).toEqual([])
  })

  it('un audio largo se parte en ventanas contiguas de 30 s o menos que lo cubren completo', () => {
    const audio = tone(95)
    const windows = planWindows(audio)
    expect(windows.length).toBe(4)
    expect(windows[0]?.start).toBe(0)
    expect(windows.at(-1)?.end).toBe(audio.length)
    for (const [index, window] of windows.entries()) {
      expect(window.end - window.start, `ventana ${index}`).toBeLessThanOrEqual(WINDOW_SECONDS * SAMPLE_RATE)
      expect(window.end, `ventana ${index}`).toBeGreaterThan(window.start)
      if (index > 0) expect(window.start).toBe(windows[index - 1]?.end)
    }
  })

  it('corta en el silencio más cercano al final de la ventana, para no partir una palabra', () => {
    const audio = withQuiet(tone(50), 27.2, 27.6)
    const [first] = planWindows(audio)
    const cut = (first?.end ?? 0) / SAMPLE_RATE
    expect(cut).toBeGreaterThanOrEqual(27.2)
    expect(cut).toBeLessThanOrEqual(27.6)
  })

  it('acepta otra frecuencia y otros tamaños', () => {
    const audio = tone(10, 0.3, 8000)
    const windows = planWindows(audio, { rate: 8000, maxSeconds: 4, searchSeconds: 1 })
    expect(windows.length).toBeGreaterThanOrEqual(3)
    expect(windows.at(-1)?.end).toBe(audio.length)
    for (const window of windows.slice(0, -1)) {
      const length = window.end - window.start
      expect(length).toBeLessThanOrEqual(4 * 8000)
      expect(length).toBeGreaterThanOrEqual(3 * 8000)
    }
  })
})

describe('silencio, mezcla y duración', () => {
  it('el silencio y el ruido de fondo no llegan al umbral; la voz sí', () => {
    expect(isSilent(new Float32Array(SAMPLE_RATE))).toBe(true)
    expect(isSilent(tone(1, SILENCE_LEVEL / 4))).toBe(true)
    expect(isSilent(tone(1, 0.2))).toBe(false)
    expect(isSilent(withQuiet(tone(3, 0.2), 0, 2.9))).toBe(false)
    expect(loudestFrame(tone(1, 0.5))).toBeCloseTo(0.5 / Math.SQRT2, 2)
  })

  it('mezcla los canales en uno promediando', () => {
    const mono = mixToMono([new Float32Array([1, 0, -1]), new Float32Array([0, 1, -1])])
    expect([...mono]).toEqual([0.5, 0.5, -1])
    const single = new Float32Array([0.1, 0.2])
    expect(mixToMono([single])).toBe(single)
    expect(mixToMono([]).length).toBe(0)
  })

  it('la duración sale de las muestras a 16 kHz', () => {
    expect(durationOf(tone(2.5))).toBe(2.5)
  })
})
