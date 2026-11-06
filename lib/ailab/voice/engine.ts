import type { LabTaskContext } from '@/lib/ailab/core/worker-runtime'
import { durationOf, isSilent, planWindows } from './audio'
import {
  SAMPLE_RATE,
  WHISPER_DTYPE,
  WHISPER_REPOS,
  isWhisperLanguage,
  isWhisperModelId,
  type WhisperDevice,
  type WhisperModelId,
  type WhisperProgress,
  type WhisperRequest,
  type WhisperResult,
  type WhisperSegment,
} from './protocol'

export type AsrChunk = { timestamp: ReadonlyArray<number | null>; text: string }

export type AsrOutput = { text: string; chunks?: AsrChunk[] }

export type AsrOptions = { language: string; task: 'transcribe'; return_timestamps: true }

export type AsrPipeline = ((audio: Float32Array, options: AsrOptions) => Promise<AsrOutput | AsrOutput[]>) & {
  dispose?: () => Promise<unknown>
}

export type LoadEvent = { status: string; file?: string; loaded?: number; total?: number }

export type PipelineLoader = (
  repo: string,
  options: { device: WhisperDevice; dtype: typeof WHISPER_DTYPE; progress_callback: (event: LoadEvent) => void },
) => Promise<AsrPipeline>

export type WhisperEngineDeps = {
  load: PipelineLoader
  devices: () => Promise<WhisperDevice[]>
  now?: () => number
  progressEveryMs?: number
}

type Loaded = { model: WhisperModelId; device: WhisperDevice; pipe: AsrPipeline }

type Context = Pick<LabTaskContext<WhisperProgress>, 'signal' | 'progress' | 'checkpoint'>

const round = (value: number) => Math.round(value * 1000) / 1000

export function toSegments(output: AsrOutput, offset: number, windowEnd: number): WhisperSegment[] {
  const chunks = output.chunks?.length ? output.chunks : [{ timestamp: [0, null], text: output.text }]
  const segments: WhisperSegment[] = []
  for (const chunk of chunks) {
    const text = chunk.text.replace(/\s+/g, ' ').trim()
    if (!text) continue
    const start = Math.min(windowEnd, offset + Math.max(0, chunk.timestamp[0] ?? 0))
    const tail = chunk.timestamp[1]
    const end = Math.max(start, Math.min(windowEnd, tail === null || tail === undefined ? windowEnd : offset + tail))
    segments.push({ start: round(start), end: round(end), text })
  }
  return segments
}

export function createWhisperEngine(deps: WhisperEngineDeps) {
  const now = deps.now ?? (() => performance.now())
  const every = deps.progressEveryMs ?? 120
  let current: Loaded | null = null
  let pending: { model: WhisperModelId; promise: Promise<Loaded> } | null = null

  async function open(model: WhisperModelId, context: Context): Promise<Loaded> {
    if (current) {
      const previous = current
      current = null
      await previous.pipe.dispose?.().catch(() => {})
    }
    const files = new Map<string, { loaded: number; total: number }>()
    let last = Number.NEGATIVE_INFINITY
    let failure: unknown = null
    for (const device of await deps.devices()) {
      let prepared = false
      const report = (event: LoadEvent) => {
        if (event.status !== 'progress' || !event.file) return
        files.set(event.file, { loaded: event.loaded ?? 0, total: event.total ?? 0 })
        let loaded = 0
        let total = 0
        for (const file of files.values()) {
          loaded += file.loaded
          total += file.total
        }
        const complete = total > 0 && loaded >= total
        const at = now()
        if (!complete && at - last < every) return
        last = at
        context.progress({ stage: 'download', loaded, total })
        if (complete && !prepared) {
          prepared = true
          context.progress({ stage: 'prepare', device })
        }
      }
      try {
        const pipe = await deps.load(WHISPER_REPOS[model], { device, dtype: WHISPER_DTYPE, progress_callback: report })
        return { model, device, pipe }
      } catch (error) {
        failure = error
        if (context.signal.aborted) break
      }
    }
    throw failure instanceof Error ? failure : new Error(String(failure))
  }

  async function ensure(model: WhisperModelId, context: Context): Promise<Loaded> {
    if (current?.model === model) return current
    if (pending?.model === model) return pending.promise
    const promise = open(model, context).then(
      (loaded) => {
        current = loaded
        return loaded
      },
    )
    const entry = { model, promise }
    pending = entry
    try {
      return await promise
    } finally {
      if (pending === entry) pending = null
    }
  }

  async function transcribe(loaded: Loaded, audio: Float32Array, language: string, context: Context): Promise<WhisperResult> {
    const windows = planWindows(audio)
    const segments: WhisperSegment[] = []
    const began = now()
    context.progress({ stage: 'transcribe', done: 0, total: windows.length, segments: [] })
    for (const [index, window] of windows.entries()) {
      await context.checkpoint()
      const slice = audio.subarray(window.start, window.end)
      let fresh: WhisperSegment[] = []
      if (!isSilent(slice)) {
        const output = await loaded.pipe(slice, { language, task: 'transcribe', return_timestamps: true })
        const first = Array.isArray(output) ? output[0] : output
        if (first) fresh = toSegments(first, window.start / SAMPLE_RATE, window.end / SAMPLE_RATE)
      }
      segments.push(...fresh)
      context.progress({ stage: 'transcribe', done: index + 1, total: windows.length, segments: fresh })
    }
    await context.checkpoint()
    return {
      type: 'transcript',
      model: loaded.model,
      device: loaded.device,
      text: segments.map((segment) => segment.text).join(' '),
      segments,
      seconds: round(durationOf(audio)),
      ms: Math.round(now() - began),
    }
  }

  return {
    get loaded(): { model: WhisperModelId; device: WhisperDevice } | null {
      return current ? { model: current.model, device: current.device } : null
    },
    async handle(request: WhisperRequest, context: Context): Promise<WhisperResult> {
      if (!request || typeof request !== 'object' || !isWhisperModelId(request.model)) {
        throw new TypeError('whisper: modelo desconocido')
      }
      if (request.type === 'load') {
        const started = now()
        const loaded = await ensure(request.model, context)
        return { type: 'loaded', model: loaded.model, device: loaded.device, ms: Math.round(now() - started) }
      }
      if (request.type === 'transcribe') {
        if (!isWhisperLanguage(request.language)) throw new TypeError('whisper: idioma desconocido')
        if (!(request.audio instanceof Float32Array)) throw new TypeError('whisper: el audio debe ser Float32Array a 16 kHz')
        const loaded = await ensure(request.model, context)
        return transcribe(loaded, request.audio, request.language, context)
      }
      throw new TypeError('whisper: pedido desconocido')
    },
  }
}
