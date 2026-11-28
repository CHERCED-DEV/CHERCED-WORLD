import type { SemanticDevice } from './protocol'

export type DownloadProgress = (loaded: number, total: number) => void

export type ModelProgressEvent = { status?: string; file?: string; loaded?: number; total?: number }

export function aggregateProgress(onProgress: DownloadProgress): (event: ModelProgressEvent) => void {
  const files = new Map<string, { loaded: number; total: number }>()
  return (event) => {
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

export async function withFallback<T>(device: SemanticDevice, load: (device: SemanticDevice) => Promise<T>): Promise<{ value: T; device: SemanticDevice }> {
  if (device === 'webgpu') {
    try {
      return { value: await load('webgpu'), device: 'webgpu' }
    } catch {}
  }
  return { value: await load('wasm'), device: 'wasm' }
}
