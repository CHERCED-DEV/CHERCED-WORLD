'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LabDownload, LabExperimentId } from '@/content/types'
import { hasConsent, onConsentChange, requestDownload, toDownloadRequest } from '@/lib/ailab/core/consent'
import { useLabWorker } from '@/lib/ailab/core/use-lab-worker'
import type { ObraEstimated, ObraInput, ObraProgress, ObraReady, ObraRequest, ObraResult, ObraStage } from '@/lib/ailab/pyodide/protocol'

export type PythonPhase = 'idle' | 'asking' | 'declined' | 'loading' | 'ready' | 'failed'

export type PythonNotice = 'evicted' | 'revoked' | null

export type PythonState = {
  phase: PythonPhase
  stage: ObraStage | null
  runtime: ObraReady | null
  paused: boolean
  notice: PythonNotice
}

const INITIAL: PythonState = { phase: 'idle', stage: null, runtime: null, paused: false, notice: null }

const CONSENT_OPEN = 'dialog[open] [data-cw-lab-consent-text]'

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => window.setTimeout(resolve, 0)))
}

export async function consentDialogClosed(maxFrames = 60): Promise<void> {
  for (let frame = 0; frame < maxFrames && document.querySelector(CONSENT_OPEN); frame += 1) await nextFrame()
  await nextFrame()
}

export function useObraPython({ experiment, downloads, source }: { experiment: LabExperimentId; downloads: LabDownload[]; source: string }) {
  const [state, setState] = useState<PythonState>(INITIAL)
  const spawned = useRef(false)
  const generation = useRef(0)

  const worker = useLabWorker<ObraRequest, ObraResult, ObraProgress>(
    () => new Worker(new URL('../../../lib/ailab/pyodide/worker.ts', import.meta.url), { type: 'module' }),
    {
      experiment,
      onEvict: () => {
        generation.current += 1
        spawned.current = false
        setState((current) => ({ ...INITIAL, paused: current.paused, notice: 'evicted' }))
      },
      onPause: (paused) => setState((current) => ({ ...current, paused })),
    },
  )

  const release = useCallback(
    (notice: PythonNotice) => {
      generation.current += 1
      if (spawned.current) worker().terminate()
      spawned.current = false
      setState((current) => ({ ...INITIAL, paused: current.paused, notice }))
    },
    [worker],
  )

  useEffect(
    () =>
      onConsentChange(() => {
        if (spawned.current && downloads.some((download) => !hasConsent(experiment, download.resource))) release('revoked')
      }),
    [downloads, experiment, release],
  )

  const activate = useCallback(async (): Promise<boolean> => {
    generation.current += 1
    const turn = generation.current
    setState((current) => ({ ...current, phase: 'asking', stage: null, notice: null }))
    let asked = false
    for (const download of downloads) {
      if (hasConsent(experiment, download.resource)) continue
      if (asked) await consentDialogClosed()
      if (turn !== generation.current) return false
      const accepted = await requestDownload(toDownloadRequest(experiment, download))
      asked = true
      if (turn !== generation.current) return false
      if (!accepted) {
        setState((current) => ({ ...current, phase: 'declined' }))
        return false
      }
    }
    setState((current) => ({ ...current, phase: 'loading', stage: 'core' }))
    spawned.current = true
    try {
      const result = await worker().call(
        { type: 'load', source },
        {
          onProgress: (progress) => {
            if (turn === generation.current) setState((current) => ({ ...current, stage: progress.stage }))
          },
        },
      )
      if (turn !== generation.current) return false
      if (result.type !== 'ready') throw new TypeError('El worker de Python no respondió como se esperaba')
      setState((current) => ({ ...current, phase: 'ready', stage: null, runtime: result }))
      return true
    } catch {
      if (turn !== generation.current) return false
      setState((current) => ({ ...current, phase: 'failed', stage: null }))
      return false
    }
  }, [downloads, experiment, source, worker])

  const estimate = useCallback(
    async (input: ObraInput, signal: AbortSignal): Promise<ObraEstimated> => {
      const result = await worker().call({ type: 'estimate', input }, { signal })
      if (result.type !== 'estimate') throw new TypeError('El worker de Python no devolvió un estimado')
      return result
    },
    [worker],
  )

  return { state, activate, estimate }
}
