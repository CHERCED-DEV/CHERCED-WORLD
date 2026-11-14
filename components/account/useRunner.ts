'use client'

import { useCallback, useState, useTransition } from 'react'
import type { ActionResult } from '@/lib/actions/result'

export type Runner<T> = {
  pending: boolean
  result: ActionResult<T> | null
  run: (task: () => Promise<ActionResult<T>>, onDone?: (result: ActionResult<T>) => void) => void
  clear: () => void
}

export function useRunner<T = void>(): Runner<T> {
  const [pending, start] = useTransition()
  const [result, setResult] = useState<ActionResult<T> | null>(null)
  const run = useCallback<Runner<T>['run']>((task, onDone) => {
    setResult(null)
    start(async () => {
      let next: ActionResult<T>
      try {
        next = await task()
      } catch {
        next = { ok: false, error: 'unavailable' }
      }
      setResult(next)
      onDone?.(next)
    })
  }, [])
  const clear = useCallback(() => setResult(null), [])
  return { pending, result, run, clear }
}
