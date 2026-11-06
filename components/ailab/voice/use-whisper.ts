'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LabExperimentId } from '@/content/types'
import { hasConsent, requestDownload, toDownloadRequest } from '@/lib/ailab/core/consent'
import { useLabWorker } from '@/lib/ailab/core/use-lab-worker'
import { WHISPER_DOWNLOADS } from '@/lib/ailab/voice/models'
import type {
  WhisperDevice,
  WhisperLanguage,
  WhisperModelId,
  WhisperProgress,
  WhisperRequest,
  WhisperResult,
  WhisperSegment,
  WhisperTranscript,
} from '@/lib/ailab/voice/protocol'

export const IDLE_RELEASE_MS = 5 * 60_000

export type EnginePhase = 'idle' | 'asking' | 'declined' | 'loading' | 'ready' | 'working' | 'error'

export type EngineNotice = 'cancelled' | 'released' | 'evicted' | null

export type EngineState = {
  phase: EnginePhase
  model: WhisperModelId | null
  device: WhisperDevice | null
  download: { loaded: number; total: number } | null
  preparing: boolean
  work: { done: number; total: number } | null
  failed: 'load' | 'transcribe' | null
  paused: boolean
  notice: EngineNotice
}

export type LoadOutcome = 'ready' | 'declined' | 'failed' | 'cancelled'

export type TranscribeOutcome =
  | { status: 'done'; transcript: WhisperTranscript }
  | { status: Exclude<LoadOutcome, 'ready'> }

const INITIAL: EngineState = {
  phase: 'idle',
  model: null,
  device: null,
  download: null,
  preparing: false,
  work: null,
  failed: null,
  paused: false,
  notice: null,
}

function isAbort(error: unknown): boolean {
  return (error as { name?: unknown } | null)?.name === 'AbortError'
}

export function useWhisper(experiment: LabExperimentId) {
  const [state, setState] = useState<EngineState>(INITIAL)
  const loaded = useRef<WhisperModelId | null>(null)
  const loading = useRef<{ model: WhisperModelId; promise: Promise<LoadOutcome> } | null>(null)
  const work = useRef<AbortController | null>(null)
  const spawned = useRef(false)
  const idleTimer = useRef<number | null>(null)

  const patch = useCallback((next: Partial<EngineState>) => setState((current) => ({ ...current, ...next })), [])

  const worker = useLabWorker<WhisperRequest, WhisperResult, WhisperProgress>(
    () => new Worker(new URL('../../../lib/ailab/voice/whisper.worker.ts', import.meta.url), { type: 'module' }),
    {
      experiment,
      onEvict: () => {
        loaded.current = null
        loading.current = null
        spawned.current = false
        setState({ ...INITIAL, notice: 'evicted' })
      },
      onPause: (paused) => patch({ paused }),
    },
  )

  const clearIdle = useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current)
    idleTimer.current = null
  }, [])

  const release = useCallback(
    (notice: EngineNotice) => {
      clearIdle()
      work.current?.abort()
      work.current = null
      loading.current = null
      loaded.current = null
      if (spawned.current) worker().terminate()
      spawned.current = false
      setState((current) => ({ ...INITIAL, paused: current.paused, notice }))
    },
    [clearIdle, worker],
  )

  const armIdle = useCallback(() => {
    clearIdle()
    idleTimer.current = window.setTimeout(() => release('released'), IDLE_RELEASE_MS)
  }, [clearIdle, release])

  useEffect(() => clearIdle, [clearIdle])

  const load = useCallback(
    async (model: WhisperModelId): Promise<LoadOutcome> => {
      clearIdle()
      const download = WHISPER_DOWNLOADS[model]
      if (!hasConsent(experiment, download.resource)) {
        patch({ phase: 'asking' })
        const accepted = await requestDownload(toDownloadRequest(experiment, download))
        if (!accepted) {
          patch({ phase: loaded.current ? 'ready' : 'declined' })
          return 'declined'
        }
      }
      if (loaded.current === model) {
        patch({ phase: 'ready', model })
        return 'ready'
      }
      if (loading.current?.model === model) return loading.current.promise
      if (loading.current) release(null)
      setState((current) => ({
        ...current,
        phase: 'loading',
        model,
        device: null,
        download: { loaded: 0, total: download.bytes },
        preparing: false,
        work: null,
        failed: null,
        notice: null,
      }))
      spawned.current = true
      const promise: Promise<LoadOutcome> = worker()
        .call(
          { type: 'load', model },
          {
            onProgress: (progress) => {
              if (loading.current?.promise !== promise) return
              if (progress.stage === 'download') {
                patch({ download: { loaded: progress.loaded, total: Math.max(progress.total, download.bytes) } })
              } else if (progress.stage === 'prepare') {
                patch({ preparing: true, device: progress.device })
              }
            },
          },
        )
        .then(
          (result): LoadOutcome => {
            if (loading.current?.promise !== promise) return 'cancelled'
            loaded.current = model
            patch({ phase: 'ready', model, device: result.device, download: null, preparing: false })
            armIdle()
            return 'ready'
          },
          (): LoadOutcome => {
            if (loading.current?.promise !== promise) return 'cancelled'
            patch({ phase: 'error', failed: 'load', download: null, preparing: false })
            return 'failed'
          },
        )
        .finally(() => {
          if (loading.current?.promise === promise) loading.current = null
        })
      loading.current = { model, promise }
      return promise
    },
    [armIdle, clearIdle, experiment, patch, release, worker],
  )

  const transcribe = useCallback(
    async (
      audio: Float32Array,
      options: { model: WhisperModelId; language: WhisperLanguage; onSegments?: (segments: WhisperSegment[]) => void },
    ): Promise<TranscribeOutcome> => {
      const ready = await load(options.model)
      if (ready !== 'ready') return { status: ready }
      clearIdle()
      const controller = new AbortController()
      work.current = controller
      patch({ phase: 'working', work: { done: 0, total: 0 }, failed: null, notice: null })
      try {
        const result = await worker().call(
          { type: 'transcribe', model: options.model, audio, language: options.language },
          {
            signal: controller.signal,
            transfer: [audio.buffer],
            onProgress: (progress) => {
              if (progress.stage !== 'transcribe' || work.current !== controller) return
              patch({ work: { done: progress.done, total: progress.total } })
              if (progress.segments.length > 0) options.onSegments?.(progress.segments)
            },
          },
        )
        if (work.current === controller) patch({ phase: 'ready', work: null })
        armIdle()
        return result.type === 'transcript' ? { status: 'done', transcript: result } : { status: 'failed' }
      } catch (error) {
        const owner = work.current === controller
        if (isAbort(error) || controller.signal.aborted) {
          if (owner) patch({ phase: loaded.current ? 'ready' : 'idle', work: null, notice: 'cancelled' })
          return { status: 'cancelled' }
        }
        if (owner) patch({ phase: 'error', failed: 'transcribe', work: null })
        return { status: 'failed' }
      } finally {
        if (work.current === controller) work.current = null
      }
    },
    [armIdle, clearIdle, load, patch, worker],
  )

  const cancel = useCallback(() => {
    if (loading.current) release('cancelled')
    else work.current?.abort()
  }, [release])

  return { state, load, transcribe, cancel, release }
}
