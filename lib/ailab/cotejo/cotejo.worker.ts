import { CORE_VERSION, type CotejoReport, type Lang } from 'cotejo-core'
import type { Embedder, FeatureExtractor, NliModel, NliScores, SequenceClassifier, SequenceTokenizer } from 'cotejo-semantic'
import type { LoadedIndex, RepoIndex } from 'cotejo-trace'
import { serveLabWorker, type LabTaskContext } from '@/lib/ailab/core/worker-runtime'
import { combine, exportsOf, runDeterministic, type LayerExtras } from './engine'
import { aggregateProgress, onnxVersion, withFallback, type DownloadProgress } from './loading'
import type { CotejoInput, CotejoProgress, CotejoRequest, CotejoResult, SemanticDevice } from './protocol'

type Current = { input: CotejoInput; base: CotejoReport; extras: LayerExtras }

async function transformers() {
  const tf = await import('@huggingface/transformers')
  tf.env.allowLocalModels = false
  tf.env.useBrowserCache = true
  const wasm = tf.env.backends.onnx.wasm
  if (wasm) wasm.wasmPaths = undefined
  return tf
}

async function loadEmbedder(device: SemanticDevice, onProgress: DownloadProgress): Promise<{ embedder: Embedder; device: SemanticDevice; onnxRuntime: string | null }> {
  const [tf, semantic, { EMBEDDING_MODEL, SEMANTIC_DTYPE }] = await Promise.all([transformers(), import('cotejo-semantic'), import('./semantic')])
  const progress = aggregateProgress(onProgress)
  const { value, device: used } = await withFallback(device, async (target) =>
    (await tf.pipeline('feature-extraction', EMBEDDING_MODEL, { device: target, dtype: SEMANTIC_DTYPE, progress_callback: progress as never })) as unknown as FeatureExtractor,
  )
  return { embedder: semantic.transformersEmbedder(value, EMBEDDING_MODEL), device: used, onnxRuntime: onnxVersion(tf.env) }
}

async function loadNli(lang: Lang, device: SemanticDevice, onProgress: DownloadProgress): Promise<{ nli: NliModel; device: SemanticDevice }> {
  const [tf, semantic, { NLI_MODELS, SEMANTIC_DTYPE }] = await Promise.all([transformers(), import('cotejo-semantic'), import('./semantic')])
  const id = NLI_MODELS[lang]
  const progress = aggregateProgress(onProgress)
  const tokenizer = (await tf.AutoTokenizer.from_pretrained(id, { progress_callback: progress as never })) as unknown as SequenceTokenizer
  const { value, device: used } = await withFallback(device, async (target) =>
    (await tf.AutoModelForSequenceClassification.from_pretrained(id, { device: target, dtype: SEMANTIC_DTYPE, progress_callback: progress as never })) as unknown as SequenceClassifier,
  )
  return { nli: semantic.transformersNli(tokenizer, value, id), device: used }
}

type Loaded<T> = { value: T; device: SemanticDevice }

let current: Current | null = null

let index: Promise<LoadedIndex> | null = null

let embedder: Promise<Loaded<Embedder> & { onnxRuntime: string | null }> | null = null

let nli: Partial<Record<Lang, Promise<Loaded<NliModel>>>> = {}

const nliCache = new Map<string, NliScores>()

function now(): number {
  return performance.now()
}

function requireCurrent(): Current {
  if (!current) throw new Error('Primero analiza una spec')
  return current
}

function report(state: Current): CotejoReport {
  return combine(state.base, state.extras)
}

async function loadedIndex(context: LabTaskContext<CotejoProgress>): Promise<LoadedIndex> {
  if (!index) {
    context.progress({ stage: 'index' })
    index = Promise.all([import('cotejo-trace'), import('@/content/ailab/cotejo/repo-index.json')]).then(([trace, data]) =>
      trace.loadIndex((data as unknown as { default: RepoIndex }).default),
    )
  }
  try {
    return await index
  } catch (error) {
    index = null
    throw error
  }
}

async function settle<T>(slot: Promise<T>, reset: () => void): Promise<T> {
  try {
    return await slot
  } catch (error) {
    reset()
    throw error
  }
}

serveLabWorker<CotejoRequest, CotejoResult, CotejoProgress>(async (request, context) => {
  if (request.type === 'ping') return { type: 'ready', core: CORE_VERSION }

  if (request.type === 'analyze') {
    const run = runDeterministic(request.input, now)
    current = { input: request.input, base: run.report, extras: {} }
    return { type: 'analyzed', report: run.report, lines: run.lines, ms: run.ms }
  }

  if (request.type === 'trace') {
    const state = requireCurrent()
    const loaded = await loadedIndex(context)
    await context.checkpoint()
    const { runTrace } = await import('./trace')
    const run = runTrace(state.input.text, state.input.path, state.base.lang, loaded, now)
    state.extras = { ...state.extras, trace: { findings: run.findings, ms: run.view.ms } }
    return { type: 'traced', report: report(state), trace: run.view }
  }

  if (request.type === 'load') {
    const started = now()
    const onProgress = (loaded: number, total: number) => context.progress({ stage: 'download', model: request.model, loaded, total })
    if (request.model === 'embeddings') {
      embedder ??= loadEmbedder(request.device, onProgress).then((result) => ({ value: result.embedder, device: result.device, onnxRuntime: result.onnxRuntime }))
      const result = await settle(embedder, () => {
        embedder = null
      })
      return { type: 'loaded', model: 'embeddings', device: result.device, ms: now() - started }
    }
    const lang = requireCurrent().base.lang
    nli[lang] ??= loadNli(lang, request.device, onProgress).then((result) => ({ value: result.nli, device: result.device }))
    const result = await settle(nli[lang]!, () => {
      delete nli[lang]
    })
    return { type: 'loaded', model: 'nli', device: result.device, ms: now() - started }
  }

  if (request.type === 'semantic') {
    const state = requireCurrent()
    if (!embedder) throw new Error('Los embeddings no están cargados')
    const loadedEmbedder = await embedder
    const loadedNli = request.nli ? await (nli[state.base.lang] ?? Promise.reject(new Error('El NLI no está cargado'))) : null
    const { runSemantic } = await import('./semantic')
    const run = await runSemantic(
      state.input.text,
      state.input.path,
      state.base,
      { embedder: loadedEmbedder.value, nli: loadedNli?.value ?? null, device: loadedNli?.device ?? loadedEmbedder.device, onnxRuntime: loadedEmbedder.onnxRuntime },
      nliCache,
      now,
    )
    await context.checkpoint()
    state.extras = { ...state.extras, semantic: { findings: run.findings, models: run.models, onnxRuntime: run.onnxRuntime, ms: run.ms } }
    return { type: 'semantic', report: report(state), semantic: run.view }
  }

  if (request.type === 'export') return { type: 'exported', exports: exportsOf(report(requireCurrent())) }

  embedder = null
  nli = {}
  nliCache.clear()
  if (current) current.extras = { ...current.extras, semantic: null }
  return { type: 'unloaded' }
})
