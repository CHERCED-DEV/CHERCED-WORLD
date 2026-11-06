import { mixToMono } from './audio'
import { SAMPLE_RATE } from './protocol'

export const MAX_FILE_BYTES = 200_000_000

export class AudioReadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AudioReadError'
  }
}

type ContextConstructor = typeof AudioContext

function audioContextConstructor(): ContextConstructor | null {
  if (typeof window === 'undefined') return null
  const scope = window as unknown as { AudioContext?: ContextConstructor; webkitAudioContext?: ContextConstructor }
  return scope.AudioContext ?? scope.webkitAudioContext ?? null
}

export function canDecodeAudio(): boolean {
  return audioContextConstructor() !== null && typeof OfflineAudioContext !== 'undefined'
}

async function resample(samples: Float32Array, from: number): Promise<Float32Array> {
  const length = Math.max(1, Math.ceil((samples.length * SAMPLE_RATE) / from))
  const offline = new OfflineAudioContext(1, length, SAMPLE_RATE)
  const buffer = offline.createBuffer(1, samples.length, from)
  buffer.copyToChannel(new Float32Array(samples), 0)
  const source = offline.createBufferSource()
  source.buffer = buffer
  source.connect(offline.destination)
  source.start()
  const rendered = await offline.startRendering()
  return new Float32Array(rendered.getChannelData(0))
}

export async function decodeToMono(blob: Blob): Promise<Float32Array> {
  const Context = audioContextConstructor()
  if (!Context) throw new AudioReadError('Este navegador no decodifica audio')
  const data = await blob.arrayBuffer()
  let context: AudioContext
  try {
    context = new Context({ sampleRate: SAMPLE_RATE })
  } catch {
    context = new Context()
  }
  try {
    const decoded = await context.decodeAudioData(data)
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) => new Float32Array(decoded.getChannelData(index)))
    const mono = mixToMono(channels)
    return decoded.sampleRate === SAMPLE_RATE ? mono : await resample(mono, decoded.sampleRate)
  } catch (error) {
    throw new AudioReadError(error instanceof Error ? error.message : String(error))
  } finally {
    void context.close().catch(() => {})
  }
}

export function probeDuration(blob: Blob, timeoutMs = 4000): Promise<number | null> {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return Promise.resolve(null)
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const audio = document.createElement('audio')
    audio.preload = 'metadata'
    let settled = false
    const done = (value: number | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      audio.removeAttribute('src')
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = window.setTimeout(() => done(null), timeoutMs)
    audio.addEventListener('loadedmetadata', () => done(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null))
    audio.addEventListener('error', () => done(null))
    audio.src = url
  })
}
