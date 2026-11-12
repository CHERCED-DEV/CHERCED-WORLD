'use client'

import { useCallback, useRef, useState } from 'react'
import type { LabDownload, LabExperimentId } from '@/content/types'
import { hasConsent, requestDownload, toDownloadRequest } from '@/lib/ailab/core/consent'
import { useLabWorker } from '@/lib/ailab/core/use-lab-worker'
import {
  decodeVectors,
  isMeaningVectors,
  rankByMeaning,
  type DecodedVectors,
  type MeaningHit,
  type MeaningProgress,
  type MeaningRequest,
  type MeaningResult,
} from '@/lib/ailab/search/meaning'
import type { Locale } from '@/lib/i18n/config'

export type MeaningPhase = 'off' | 'asking' | 'declined' | 'loading' | 'ready' | 'failed' | 'unavailable'

export type MeaningState = {
  phase: MeaningPhase
  download: { loaded: number; total: number } | null
  hits: MeaningHit[] | null
  query: string
  ms: number | null
}

const INITIAL: MeaningState = { phase: 'off', download: null, hits: null, query: '', ms: null }

export function meaningVectorsUrl(lang: Locale): string {
  return `/api/search-vectors/${lang}`
}

function isAbort(error: unknown): boolean {
  return (error as { name?: unknown } | null)?.name === 'AbortError'
}

export function useMeaning(experiment: LabExperimentId, lang: Locale, download: LabDownload | null) {
  const [state, setState] = useState<MeaningState>(INITIAL)
  const vectors = useRef<DecodedVectors | null>(null)
  const ready = useRef(false)
  const searching = useRef<AbortController | null>(null)

  const worker = useLabWorker<MeaningRequest, MeaningResult, MeaningProgress>(
    () => new Worker(new URL('../../../lib/ailab/search/meaning.worker.ts', import.meta.url), { type: 'module' }),
    {
      experiment,
      onEvict: () => {
        ready.current = false
        setState(INITIAL)
      },
    },
  )

  const enable = useCallback(async (): Promise<void> => {
    if (ready.current) {
      setState((current) => ({ ...current, phase: 'ready' }))
      return
    }
    if (!download) {
      setState({ ...INITIAL, phase: 'unavailable' })
      return
    }
    if (!vectors.current) {
      try {
        const response = await fetch(meaningVectorsUrl(lang), { headers: { accept: 'application/json' } })
        const body: unknown = response.ok ? await response.json() : null
        if (!isMeaningVectors(body) || body.docs.length === 0) {
          setState({ ...INITIAL, phase: 'unavailable' })
          return
        }
        vectors.current = decodeVectors(body)
      } catch {
        setState({ ...INITIAL, phase: 'failed' })
        return
      }
    }
    if (!hasConsent(experiment, download.resource)) {
      setState({ ...INITIAL, phase: 'asking' })
      if (!(await requestDownload(toDownloadRequest(experiment, download)))) {
        setState({ ...INITIAL, phase: 'declined' })
        return
      }
    }
    setState({ ...INITIAL, phase: 'loading', download: { loaded: 0, total: download.bytes } })
    try {
      await worker().call(
        { type: 'load' },
        { onProgress: (progress) => setState((current) => ({ ...current, download: { loaded: progress.loaded, total: progress.total } })) },
      )
      ready.current = true
      setState({ ...INITIAL, phase: 'ready' })
    } catch {
      setState({ ...INITIAL, phase: 'failed' })
    }
  }, [download, experiment, lang, worker])

  const search = useCallback(
    async (query: string): Promise<void> => {
      searching.current?.abort()
      if (!ready.current || !vectors.current) return
      const text = query.trim()
      if (!text) {
        setState((current) => ({ ...current, hits: null, query: '', ms: null }))
        return
      }
      const controller = new AbortController()
      searching.current = controller
      try {
        const result = await worker().call({ type: 'embed', text }, { signal: controller.signal })
        if (controller.signal.aborted || result.type !== 'embedded' || !vectors.current) return
        setState((current) => ({ ...current, hits: rankByMeaning(result.vector, vectors.current!), query: text, ms: result.ms }))
      } catch (error) {
        if (!isAbort(error)) setState((current) => ({ ...current, phase: 'failed' }))
      }
    },
    [worker],
  )

  return { state, enable, search }
}
