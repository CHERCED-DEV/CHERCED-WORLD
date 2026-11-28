'use client'

import type { CotejoReport } from 'cotejo-core'
import { useMemo } from 'react'
import type { LabExperimentId } from '@/content/types'
import { useLabWorker } from '@/lib/ailab/core/use-lab-worker'
import type { LabCallOptions, LabWorker } from '@/lib/ailab/core/worker'
import type { CotejoExports, CotejoInput, CotejoProgress, CotejoRequest, CotejoResult, SemanticDevice, SemanticModelKind } from './protocol'

type Result<T extends CotejoResult['type']> = Extract<CotejoResult, { type: T }>

export type CotejoWorker = LabWorker<CotejoRequest, CotejoResult, CotejoProgress>

export type CotejoClient = {
  ping(): Promise<string>
  analyze(input: CotejoInput): Promise<Result<'analyzed'> & { roundTripMs: number }>
  trace(onIndex?: () => void): Promise<Result<'traced'>>
  load(model: SemanticModelKind, device: SemanticDevice, onProgress?: (loaded: number, total: number) => void): Promise<Result<'loaded'>>
  semantic(nli: boolean): Promise<Result<'semantic'>>
  exports(): Promise<CotejoExports>
  unload(): Promise<CotejoReport | null>
}

function expectType<T extends CotejoResult['type']>(result: CotejoResult, type: T): Result<T> {
  if (result.type !== type) throw new Error(`El worker de Cotejo respondió ${result.type} en lugar de ${type}`)
  return result as Result<T>
}

export function createCotejoClient(worker: () => CotejoWorker, now: () => number = () => performance.now()): CotejoClient {
  const call = <T extends CotejoResult['type']>(request: CotejoRequest, type: T, options?: LabCallOptions<CotejoProgress>) =>
    worker()
      .call(request, options)
      .then((result) => expectType(result, type))
  return {
    ping: async () => (await call({ type: 'ping' }, 'ready')).core,
    analyze: async (input) => {
      const started = now()
      const result = await call({ type: 'analyze', input }, 'analyzed')
      return { ...result, roundTripMs: now() - started }
    },
    trace: (onIndex) => call({ type: 'trace' }, 'traced', { onProgress: (progress) => (progress.stage === 'index' ? onIndex?.() : undefined) }),
    load: (model, device, onProgress) =>
      call({ type: 'load', model, device }, 'loaded', {
        onProgress: (progress) => {
          if (progress.stage === 'download') onProgress?.(progress.loaded, progress.total)
        },
      }),
    semantic: (nli) => call({ type: 'semantic', nli }, 'semantic'),
    exports: async () => (await call({ type: 'export' }, 'exported')).exports,
    unload: async () => {
      return (await call({ type: 'unload' }, 'unloaded')).report
    },
  }
}

export function semanticDevice(scope: unknown = typeof navigator === 'undefined' ? undefined : navigator): SemanticDevice {
  return scope && typeof scope === 'object' && 'gpu' in scope && (scope as { gpu?: unknown }).gpu ? 'webgpu' : 'wasm'
}

export function useCotejoClient(experiment: LabExperimentId, onEvict: () => void): CotejoClient {
  const worker = useLabWorker<CotejoRequest, CotejoResult, CotejoProgress>(
    () => new Worker(new URL('./cotejo.worker.ts', import.meta.url), { type: 'module' }),
    { experiment, onEvict },
  )
  return useMemo(() => createCotejoClient(worker), [worker])
}
