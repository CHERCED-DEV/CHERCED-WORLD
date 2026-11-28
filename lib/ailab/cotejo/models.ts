import type { Lang } from 'cotejo-core'
import { transformersEmbedder, transformersNli, type Embedder, type FeatureExtractor, type NliModel, type SequenceClassifier, type SequenceTokenizer } from 'cotejo-semantic'
import type { SemanticDevice } from './protocol'
import { EMBEDDING_MODEL, NLI_MODELS, SEMANTIC_DTYPE } from './semantic'

export type DownloadProgress = (loaded: number, total: number) => void

type ProgressEvent = { status?: string; file?: string; loaded?: number; total?: number }

async function transformers() {
  const tf = await import('@huggingface/transformers')
  tf.env.allowLocalModels = false
  tf.env.useBrowserCache = true
  const wasm = tf.env.backends.onnx.wasm
  if (wasm) wasm.wasmPaths = undefined
  return tf
}

function aggregate(onProgress: DownloadProgress) {
  const files = new Map<string, { loaded: number; total: number }>()
  return (event: ProgressEvent) => {
    if (event.status !== 'progress' || typeof event.loaded !== 'number' || typeof event.total !== 'number') return
    files.set(event.file ?? '', { loaded: event.loaded, total: event.total })
    let loaded = 0
    let total = 0
    for (const file of files.values()) {
      loaded += file.loaded
      total += file.total
    }
    onProgress(loaded, total)
  }
}

export function onnxVersion(env: unknown): string | null {
  const versions = (env as { backends?: { onnx?: { versions?: Record<string, unknown> } } }).backends?.onnx?.versions
  const value = versions?.web ?? versions?.common
  return typeof value === 'string' ? value : null
}

async function withFallback<T>(device: SemanticDevice, load: (device: SemanticDevice) => Promise<T>): Promise<{ value: T; device: SemanticDevice }> {
  if (device === 'webgpu') {
    try {
      return { value: await load('webgpu'), device: 'webgpu' }
    } catch {}
  }
  return { value: await load('wasm'), device: 'wasm' }
}

export async function loadEmbedder(device: SemanticDevice, onProgress: DownloadProgress): Promise<{ embedder: Embedder; device: SemanticDevice; onnxRuntime: string | null }> {
  const tf = await transformers()
  const progress = aggregate(onProgress)
  const { value, device: used } = await withFallback(device, async (target) =>
    (await tf.pipeline('feature-extraction', EMBEDDING_MODEL, { device: target, dtype: SEMANTIC_DTYPE, progress_callback: progress as never })) as unknown as FeatureExtractor,
  )
  return { embedder: transformersEmbedder(value, EMBEDDING_MODEL), device: used, onnxRuntime: onnxVersion(tf.env) }
}

export async function loadNli(lang: Lang, device: SemanticDevice, onProgress: DownloadProgress): Promise<{ nli: NliModel; device: SemanticDevice }> {
  const tf = await transformers()
  const id = NLI_MODELS[lang]
  const progress = aggregate(onProgress)
  const tokenizer = (await tf.AutoTokenizer.from_pretrained(id, { progress_callback: progress as never })) as unknown as SequenceTokenizer
  const { value, device: used } = await withFallback(device, async (target) =>
    (await tf.AutoModelForSequenceClassification.from_pretrained(id, { device: target, dtype: SEMANTIC_DTYPE, progress_callback: progress as never })) as unknown as SequenceClassifier,
  )
  return { nli: transformersNli(tokenizer, value, id), device: used }
}
