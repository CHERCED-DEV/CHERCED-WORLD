export const WHISPER_MODEL_IDS = ['tiny', 'base', 'small'] as const

export type WhisperModelId = (typeof WHISPER_MODEL_IDS)[number]

export const WHISPER_REPOS: Readonly<Record<WhisperModelId, string>> = {
  tiny: 'onnx-community/whisper-tiny',
  base: 'onnx-community/whisper-base',
  small: 'onnx-community/whisper-small',
}

export const WHISPER_DTYPE = 'q8'

export const WHISPER_LANGUAGES = ['es', 'en'] as const

export type WhisperLanguage = (typeof WHISPER_LANGUAGES)[number]

export type WhisperDevice = 'webgpu' | 'wasm'

export const WHISPER_DEVICES: readonly WhisperDevice[] = ['wasm']

export const SAMPLE_RATE = 16_000

export type WhisperSegment = { start: number; end: number; text: string }

export type WhisperLoadRequest = { type: 'load'; model: WhisperModelId }

export type WhisperTranscribeRequest = {
  type: 'transcribe'
  model: WhisperModelId
  audio: Float32Array
  language: WhisperLanguage
}

export type WhisperRequest = WhisperLoadRequest | WhisperTranscribeRequest

export type WhisperLoaded = { type: 'loaded'; model: WhisperModelId; device: WhisperDevice; ms: number }

export type WhisperTranscript = {
  type: 'transcript'
  model: WhisperModelId
  device: WhisperDevice
  text: string
  segments: WhisperSegment[]
  seconds: number
  ms: number
}

export type WhisperResult = WhisperLoaded | WhisperTranscript

export type WhisperProgress =
  | { stage: 'download'; loaded: number; total: number }
  | { stage: 'prepare'; device: WhisperDevice }
  | { stage: 'transcribe'; done: number; total: number; segments: WhisperSegment[] }

export function isWhisperModelId(value: unknown): value is WhisperModelId {
  return typeof value === 'string' && (WHISPER_MODEL_IDS as readonly string[]).includes(value)
}

export function isWhisperLanguage(value: unknown): value is WhisperLanguage {
  return typeof value === 'string' && (WHISPER_LANGUAGES as readonly string[]).includes(value)
}
