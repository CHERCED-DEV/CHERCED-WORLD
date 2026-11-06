import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLabWorker, terminateLabWorkers, type LabVisibility, type LabWorkerHandle } from '@/lib/ailab/core/worker'
import { serveLabWorker, type LabWorkerScope } from '@/lib/ailab/core/worker-runtime'
import { createWhisperEngine, toSegments, type AsrOptions, type AsrPipeline, type LoadEvent, type PipelineLoader } from '@/lib/ailab/voice/engine'
import {
  SAMPLE_RATE,
  WHISPER_DEVICES,
  WHISPER_DTYPE,
  WHISPER_REPOS,
  type WhisperProgress,
  type WhisperRequest,
  type WhisperResult,
} from '@/lib/ailab/voice/protocol'

function tone(seconds: number, amplitude = 0.3): Float32Array {
  const samples = new Float32Array(Math.round(seconds * SAMPLE_RATE))
  for (let index = 0; index < samples.length; index += 1) samples[index] = amplitude * Math.sin((2 * Math.PI * 220 * index) / SAMPLE_RATE)
  return samples
}

type Calls = Array<{ length: number; options: AsrOptions }>

function fakePipeline(calls: Calls, text = (index: number) => `frase ${index + 1}`): AsrPipeline {
  const pipe = (async (audio: Float32Array, options: AsrOptions) => {
    calls.push({ length: audio.length, options })
    const seconds = audio.length / SAMPLE_RATE
    const index = calls.length - 1
    return { text: text(index), chunks: [{ timestamp: [0.5, Math.min(seconds, 4)], text: ` ${text(index)} ` }, { timestamp: [4, null], text: ' sigue ' }] }
  }) as AsrPipeline
  pipe.dispose = vi.fn(async () => {})
  return pipe
}

function context() {
  const controller = new AbortController()
  const progress: WhisperProgress[] = []
  return {
    controller,
    progress,
    ctx: {
      signal: controller.signal,
      progress: (value: WhisperProgress) => void progress.push(value),
      checkpoint: async () => {
        if (controller.signal.aborted) throw new DOMException('cancelada', 'AbortError')
      },
    },
  }
}

describe('el motor de Whisper del worker (T720, FR-350)', () => {
  it('carga el modelo multilingüe pedido en int8 (q8), con WASM, y reporta la descarga sumando archivos', async () => {
    const calls: Calls = []
    const load = vi.fn<PipelineLoader>(async (_repo, options) => {
      const events: LoadEvent[] = [
        { status: 'initiate', file: 'config.json' },
        { status: 'progress', file: 'onnx/encoder_model_quantized.onnx', loaded: 5, total: 10 },
        { status: 'progress', file: 'onnx/decoder_model_merged_quantized.onnx', loaded: 10, total: 30 },
        { status: 'progress', file: 'onnx/encoder_model_quantized.onnx', loaded: 10, total: 10 },
        { status: 'progress', file: 'onnx/decoder_model_merged_quantized.onnx', loaded: 30, total: 30 },
        { status: 'done', file: 'onnx/decoder_model_merged_quantized.onnx' },
      ]
      for (const event of events) options.progress_callback(event)
      return fakePipeline(calls)
    })
    const engine = createWhisperEngine({ load, devices: async () => [...WHISPER_DEVICES], progressEveryMs: 0 })
    const { ctx, progress } = context()
    const result = await engine.handle({ type: 'load', model: 'base' }, ctx)
    expect(result).toMatchObject({ type: 'loaded', model: 'base', device: 'wasm' })
    expect(load).toHaveBeenCalledWith('onnx-community/whisper-base', expect.objectContaining({ device: 'wasm', dtype: 'q8' }))
    expect(WHISPER_DTYPE).toBe('q8')
    expect(Object.values(WHISPER_REPOS)).toEqual(['onnx-community/whisper-tiny', 'onnx-community/whisper-base', 'onnx-community/whisper-small'])
    expect(progress.filter((item) => item.stage === 'download').at(-1)).toEqual({ stage: 'download', loaded: 40, total: 40 })
    expect(progress.at(-1)).toEqual({ stage: 'prepare', device: 'wasm' })
    expect(engine.loaded).toEqual({ model: 'base', device: 'wasm' })
  })

  it('no vuelve a cargar el mismo modelo, comparte una carga en curso y libera el anterior al cambiar', async () => {
    const pipes: AsrPipeline[] = []
    const load = vi.fn<PipelineLoader>(async () => {
      const pipe = fakePipeline([])
      pipes.push(pipe)
      return pipe
    })
    const engine = createWhisperEngine({ load, devices: async () => ['wasm'] })
    const { ctx } = context()
    await Promise.all([engine.handle({ type: 'load', model: 'tiny' }, ctx), engine.handle({ type: 'load', model: 'tiny' }, ctx)])
    await engine.handle({ type: 'load', model: 'tiny' }, ctx)
    expect(load).toHaveBeenCalledTimes(1)
    await engine.handle({ type: 'load', model: 'small' }, ctx)
    expect(load).toHaveBeenCalledTimes(2)
    expect(pipes[0]?.dispose).toHaveBeenCalledOnce()
  })

  it('si el primer backend falla, prueba el siguiente; si todos fallan, avisa el error', async () => {
    const load = vi.fn<PipelineLoader>(async (_repo, options) => {
      if (options.device === 'webgpu') throw new Error('sin adaptador')
      return fakePipeline([])
    })
    const engine = createWhisperEngine({ load, devices: async () => ['webgpu', 'wasm'] })
    expect(await engine.handle({ type: 'load', model: 'tiny' }, context().ctx)).toMatchObject({ device: 'wasm' })

    const broken = createWhisperEngine({ load: async () => Promise.reject(new Error('la descarga se cortó')), devices: async () => ['wasm'] })
    await expect(broken.handle({ type: 'load', model: 'tiny' }, context().ctx)).rejects.toThrow('la descarga se cortó')
    expect(broken.loaded).toBeNull()
  })

  it('transcribe por ventanas, corre las marcas de tiempo a su lugar y salta las ventanas en silencio', async () => {
    const calls: Calls = []
    const engine = createWhisperEngine({ load: async () => fakePipeline(calls), devices: async () => ['wasm'] })
    const { ctx, progress } = context()
    const audio = new Float32Array(SAMPLE_RATE * 70)
    audio.set(tone(25), 0)
    audio.set(tone(10), SAMPLE_RATE * 60)
    const result = (await engine.handle({ type: 'transcribe', model: 'base', audio, language: 'es' }, ctx)) as Extract<WhisperResult, { type: 'transcript' }>
    expect(calls.map((call) => call.options)).toEqual([
      { language: 'es', task: 'transcribe', return_timestamps: true },
      { language: 'es', task: 'transcribe', return_timestamps: true },
    ])
    expect(result.type).toBe('transcript')
    expect(result.seconds).toBe(70)
    expect(result.text).toBe('frase 1 sigue frase 2 sigue')
    const [first, second, third, fourth] = result.segments
    expect(first).toEqual({ start: 0.5, end: 4, text: 'frase 1' })
    expect(second).toMatchObject({ start: 4, text: 'sigue' })
    expect(second?.end).toBeGreaterThan(25)
    expect(third?.start).toBeGreaterThan(50)
    expect(fourth?.end).toBe(70)
    const steps = progress.filter((item): item is Extract<WhisperProgress, { stage: 'transcribe' }> => item.stage === 'transcribe')
    expect(steps[0]).toEqual({ stage: 'transcribe', done: 0, total: 3, segments: [] })
    expect(steps.map((step) => step.done)).toEqual([0, 1, 2, 3])
    expect(steps[2]?.segments).toEqual([])
    expect(steps.flatMap((step) => step.segments)).toEqual(result.segments)
  })

  it('se cancela entre ventanas: no sigue gastando CPU después de abortar', async () => {
    const calls: Calls = []
    const engine = createWhisperEngine({ load: async () => fakePipeline(calls), devices: async () => ['wasm'] })
    const { ctx, controller, progress } = context()
    const original = ctx.progress
    ctx.progress = (value) => {
      original(value)
      if (value.stage === 'transcribe' && value.done === 1) controller.abort()
    }
    await expect(engine.handle({ type: 'transcribe', model: 'tiny', audio: tone(80), language: 'en' }, ctx)).rejects.toMatchObject({ name: 'AbortError' })
    expect(calls).toHaveLength(1)
    expect(progress.at(-1)).toMatchObject({ stage: 'transcribe', done: 1 })
  })

  it('rechaza pedidos mal formados sin tocar el modelo', async () => {
    const load = vi.fn<PipelineLoader>(async () => fakePipeline([]))
    const engine = createWhisperEngine({ load, devices: async () => ['wasm'] })
    const { ctx } = context()
    await expect(engine.handle({ type: 'load', model: 'large' } as unknown as WhisperRequest, ctx)).rejects.toThrow(TypeError)
    await expect(engine.handle({ type: 'transcribe', model: 'tiny', audio: tone(1), language: 'fr' } as unknown as WhisperRequest, ctx)).rejects.toThrow(TypeError)
    await expect(engine.handle({ type: 'transcribe', model: 'tiny', audio: [0, 1], language: 'es' } as unknown as WhisperRequest, ctx)).rejects.toThrow(TypeError)
    await expect(engine.handle({ type: 'borrar', model: 'tiny' } as unknown as WhisperRequest, ctx)).rejects.toThrow(TypeError)
    expect(load).not.toHaveBeenCalled()
  })

  it('toSegments recorta al final de la ventana y descarta textos vacíos', () => {
    expect(
      toSegments(
        {
          text: 'x',
          chunks: [
            { timestamp: [1, 2], text: ' uno ' },
            { timestamp: [2, 2.5], text: '   ' },
            { timestamp: [28, 45], text: 'dos' },
          ],
        },
        30,
        60,
      ),
    ).toEqual([
      { start: 31, end: 32, text: 'uno' },
      { start: 58, end: 60, text: 'dos' },
    ])
    expect(toSegments({ text: ' sin marcas ' }, 0, 12)).toEqual([{ start: 0, end: 12, text: 'sin marcas' }])
  })
})

function connect(handler: Parameters<typeof serveLabWorker<WhisperRequest, WhisperResult, WhisperProgress>>[0]) {
  const toWorker = new EventTarget()
  const toMain = new EventTarget()
  const scope: LabWorkerScope = {
    postMessage: (message) => queueMicrotask(() => toMain.dispatchEvent(new MessageEvent('message', { data: structuredClone(message) }))),
    addEventListener: (type, listener) => toWorker.addEventListener(type, listener as EventListener),
    removeEventListener: (type, listener) => toWorker.removeEventListener(type, listener as EventListener),
  }
  const stop = serveLabWorker(handler, scope)
  const handle: LabWorkerHandle = {
    postMessage: (message) => queueMicrotask(() => toWorker.dispatchEvent(new MessageEvent('message', { data: structuredClone(message) }))),
    terminate: stop,
    addEventListener: (type, listener) => toMain.addEventListener(type, listener),
    removeEventListener: (type, listener) => toMain.removeEventListener(type, listener),
  }
  return handle
}

function visibility(): LabVisibility & { set: (hidden: boolean) => void } {
  const listeners = new Set<() => void>()
  let hidden = false
  return {
    get hidden() {
      return hidden
    },
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    set(next) {
      hidden = next
      for (const listener of listeners) listener()
    },
  }
}

describe('el motor detrás del harness de X0 (FR-330)', () => {
  afterEach(() => {
    terminateLabWorkers()
  })

  it('con la pestaña oculta no transcribe y retoma al volver', async () => {
    const calls: Calls = []
    const engine = createWhisperEngine({ load: async () => fakePipeline(calls), devices: async () => ['wasm'] })
    const tab = visibility()
    tab.set(true)
    const worker = createLabWorker<WhisperRequest, WhisperResult, WhisperProgress>(() => connect((request, ctx) => engine.handle(request, ctx)), { experiment: 'V1' }, { visibility: tab })
    const seen: number[] = []
    const pending = worker.call(
      { type: 'transcribe', model: 'tiny', audio: tone(55), language: 'es' },
      { onProgress: (value) => void (value.stage === 'transcribe' && seen.push(value.done)) },
    )
    await vi.waitFor(() => expect(seen).toEqual([0]))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(worker.state).toBe('paused')
    expect(calls).toHaveLength(0)
    tab.set(false)
    const result = await pending
    expect(result.type).toBe('transcript')
    expect(calls).toHaveLength(2)
    expect(seen).toEqual([0, 1, 2])
  })

  it('cancelar desde la página rechaza con AbortError y el worker sigue sirviendo', async () => {
    const engine = createWhisperEngine({ load: async () => fakePipeline([]), devices: async () => ['wasm'] })
    const worker = createLabWorker<WhisperRequest, WhisperResult, WhisperProgress>(() => connect((request, ctx) => engine.handle(request, ctx)), { experiment: 'V4' }, { visibility: null })
    const controller = new AbortController()
    const pending = worker.call({ type: 'transcribe', model: 'tiny', audio: tone(65), language: 'en' }, { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    const done = await worker.call({ type: 'transcribe', model: 'tiny', audio: tone(2), language: 'en' })
    expect(done.type).toBe('transcript')
  })
})
