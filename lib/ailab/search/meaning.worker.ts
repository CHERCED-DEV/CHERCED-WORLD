import { env, pipeline } from '@huggingface/transformers'
import { serveLabWorker, transfer } from '@/lib/ailab/core/worker-runtime'
import { MEANING_DTYPE, MEANING_MODEL, queryText, type MeaningProgress, type MeaningRequest, type MeaningResult } from './meaning'

env.allowLocalModels = false
env.useBrowserCache = true

const wasm = env.backends.onnx.wasm
if (wasm) wasm.wasmPaths = undefined

type Tensor = { data: Float32Array }

type Extractor = (text: string, options: { pooling: 'mean'; normalize: true }) => Promise<Tensor>

let extractor: Promise<Extractor> | null = null

serveLabWorker<MeaningRequest, MeaningResult, MeaningProgress>(async (request, context) => {
  const started = performance.now()
  if (request.type === 'load') {
    extractor ??= pipeline('feature-extraction', MEANING_MODEL, {
      device: 'wasm',
      dtype: MEANING_DTYPE,
      progress_callback: ((event: { status?: string; loaded?: number; total?: number }) => {
        if (event.status === 'progress' && typeof event.loaded === 'number' && typeof event.total === 'number') {
          context.progress({ stage: 'download', loaded: event.loaded, total: event.total })
        }
      }) as never,
    }) as unknown as Promise<Extractor>
    try {
      await extractor
    } catch (error) {
      extractor = null
      throw error
    }
    return { type: 'loaded', ms: Math.round(performance.now() - started) }
  }
  if (!extractor) throw new Error('El modelo no está cargado')
  const tensor = await (await extractor)(queryText(request.text), { pooling: 'mean', normalize: true })
  const vector = new Float32Array(tensor.data)
  return transfer<MeaningResult>({ type: 'embedded', vector, ms: Math.round(performance.now() - started) }, [vector.buffer])
})
