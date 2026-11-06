'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createLabWorker, type LabWorker, type LabWorkerOptions, type LabWorkerSource } from './worker'

export function useLabWorker<In, Out, Progress = never>(
  source: LabWorkerSource,
  options: LabWorkerOptions,
): () => LabWorker<In, Out, Progress> {
  const latest = useRef({ source, options })
  const current = useRef<LabWorker<In, Out, Progress> | null>(null)

  useEffect(() => {
    latest.current = { source, options }
  })

  useEffect(
    () => () => {
      current.current?.terminate()
      current.current = null
    },
    [],
  )

  return useCallback(() => {
    const existing = current.current
    if (existing && existing.state !== 'terminated') return existing
    const created = createLabWorker<In, Out, Progress>(latest.current.source, latest.current.options)
    current.current = created
    return created
  }, [])
}
