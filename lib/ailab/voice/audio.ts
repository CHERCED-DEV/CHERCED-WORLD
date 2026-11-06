import { SAMPLE_RATE } from './protocol'

export const WINDOW_SECONDS = 30

export const CUT_SEARCH_SECONDS = 4

export const FRAME_SECONDS = 0.05

export const SILENCE_LEVEL = 0.008

export const MAX_AUDIO_SECONDS = 600

export type AudioWindow = { start: number; end: number }

export type WindowOptions = { rate?: number; maxSeconds?: number; searchSeconds?: number; frameSeconds?: number }

function energy(samples: Float32Array, from: number, to: number): number {
  let sum = 0
  for (let index = from; index < to; index += 1) {
    const value = samples[index] ?? 0
    sum += value * value
  }
  return to > from ? sum / (to - from) : 0
}

export function planWindows(samples: Float32Array, options: WindowOptions = {}): AudioWindow[] {
  const rate = options.rate ?? SAMPLE_RATE
  const max = Math.round((options.maxSeconds ?? WINDOW_SECONDS) * rate)
  const search = Math.round((options.searchSeconds ?? CUT_SEARCH_SECONDS) * rate)
  const frame = Math.max(1, Math.round((options.frameSeconds ?? FRAME_SECONDS) * rate))
  const windows: AudioWindow[] = []
  let start = 0
  while (samples.length - start > max) {
    const limit = start + max
    let cut = limit
    let quietest = Number.POSITIVE_INFINITY
    for (let position = Math.max(start + frame, limit - search); position + frame <= limit; position += frame) {
      const level = energy(samples, position, position + frame)
      if (level < quietest) {
        quietest = level
        cut = position + Math.floor(frame / 2)
      }
    }
    windows.push({ start, end: cut })
    start = cut
  }
  if (samples.length > start) windows.push({ start, end: samples.length })
  return windows
}

export function loudestFrame(samples: Float32Array, rate = SAMPLE_RATE, frameSeconds = FRAME_SECONDS): number {
  const frame = Math.max(1, Math.round(frameSeconds * rate))
  let loudest = 0
  for (let position = 0; position < samples.length; position += frame) {
    loudest = Math.max(loudest, Math.sqrt(energy(samples, position, Math.min(samples.length, position + frame))))
  }
  return loudest
}

export function isSilent(samples: Float32Array, rate = SAMPLE_RATE): boolean {
  return loudestFrame(samples, rate) < SILENCE_LEVEL
}

export function mixToMono(channels: readonly Float32Array[]): Float32Array {
  const first = channels[0]
  if (!first) return new Float32Array(0)
  if (channels.length === 1) return first
  const mono = new Float32Array(first.length)
  for (const channel of channels) {
    for (let index = 0; index < mono.length; index += 1) mono[index] = (mono[index] ?? 0) + (channel[index] ?? 0) / channels.length
  }
  return mono
}

export function durationOf(samples: Float32Array, rate = SAMPLE_RATE): number {
  return samples.length / rate
}
