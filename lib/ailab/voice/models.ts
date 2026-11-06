import { WHISPER_BASE, WHISPER_SMALL, WHISPER_TINY } from '@/content/ailab/catalog'
import type { LabDownload } from '@/content/types'
import { WHISPER_MODEL_IDS, type WhisperModelId } from './protocol'

export const ONNX_RUNTIME = {
  resource: 'ONNX Runtime Web (WASM)',
  file: 'ort-wasm-simd-threaded.asyncify.wasm',
  package: 'onnxruntime-web',
  version: '1.31.0-dev.20260914-8d85527a0',
  bytes: 26_861_777,
} as const

export const MODEL_CDN = 'cdn.hf.co'

export const WHISPER_DOWNLOADS: Readonly<Record<WhisperModelId, LabDownload>> = {
  tiny: WHISPER_TINY,
  base: WHISPER_BASE,
  small: WHISPER_SMALL,
}

export function modelOf(download: Pick<LabDownload, 'resource'> | null | undefined): WhisperModelId | null {
  if (!download) return null
  return WHISPER_MODEL_IDS.find((id) => WHISPER_DOWNLOADS[id].resource === download.resource) ?? null
}

export function defaultModelOf(downloads: readonly LabDownload[], fallback: WhisperModelId = 'base'): WhisperModelId {
  return modelOf(downloads.find((download) => download.default)) ?? fallback
}

export function offeredModels(downloads: readonly LabDownload[]): WhisperModelId[] {
  const offered = new Set(downloads.map((download) => modelOf(download)).filter((id): id is WhisperModelId => id !== null))
  return WHISPER_MODEL_IDS.filter((id) => offered.has(id))
}
