import { env, pipeline } from '@huggingface/transformers'
import { serveLabWorker } from '@/lib/ailab/core/worker-runtime'
import { createWhisperEngine, type AsrPipeline, type PipelineLoader } from './engine'
import { WHISPER_DEVICES, type WhisperProgress, type WhisperRequest, type WhisperResult } from './protocol'

env.allowLocalModels = false
env.useBrowserCache = true

const wasm = env.backends.onnx.wasm
if (wasm) wasm.wasmPaths = undefined

const load: PipelineLoader = async (repo, options) =>
  (await pipeline('automatic-speech-recognition', repo, {
    device: options.device,
    dtype: options.dtype,
    progress_callback: options.progress_callback as never,
  })) as unknown as AsrPipeline

const engine = createWhisperEngine({ load, devices: async () => [...WHISPER_DEVICES] })

serveLabWorker<WhisperRequest, WhisperResult, WhisperProgress>((request, context) => engine.handle(request, context))
