'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { elapsedMs, fill, formatClock, isRouteActive, remainingMs, ROUTE_BUDGET_MS, type RouteProgress } from '@/lib/ailab/route/progress'
import type { RouteClockLabels } from './labels'
import styles from './RouteView.module.scss'

type Props = { progress: RouteProgress; labels: RouteClockLabels; onOver: () => void }

export type RouteClockState = 'idle' | 'running' | 'over' | 'done'

export function clockState(progress: RouteProgress, now: number): RouteClockState {
  if (progress.startedAt === null) return 'idle'
  if (progress.endedAt !== null) return 'done'
  return remainingMs(progress, now) < 0 ? 'over' : 'running'
}

export function RouteClock({ progress, labels, onOver }: Props) {
  const labelId = useId()
  const [now, setNow] = useState(() => Date.now())
  const running = isRouteActive(progress)
  const startedAt = progress.startedAt
  const overRef = useRef(onOver)
  const announced = useRef<number | null>(null)

  useEffect(() => {
    overRef.current = onOver
  }, [onOver])

  useEffect(() => {
    if (!running || startedAt === null) return
    const tick = () => {
      const at = Date.now()
      setNow(at)
      if (at - startedAt > ROUTE_BUDGET_MS && announced.current !== startedAt) {
        announced.current = startedAt
        overRef.current()
      }
    }
    if (Date.now() - startedAt > ROUTE_BUDGET_MS) announced.current = startedAt
    const timer = window.setInterval(tick, 500)
    const wake = () => {
      if (document.visibilityState === 'visible') tick()
    }
    const first = window.setTimeout(tick, 0)
    document.addEventListener('visibilitychange', wake)
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(first)
      document.removeEventListener('visibilitychange', wake)
    }
  }, [running, startedAt])

  const at = startedAt === null ? now : Math.max(now, startedAt)
  const state = clockState(progress, at)
  const status =
    state === 'idle' ? labels.idle : state === 'over' ? labels.over : state === 'done' ? fill(labels.done, { time: formatClock(elapsedMs(progress, at)) }) : null

  return (
    <div className={styles.clock} data-cw-route-clock={state}>
      <p id={labelId} className={styles.clockLabel}>
        {labels.label}
      </p>
      <p className={styles.clockTime} role="timer" aria-labelledby={labelId} data-cw-route-time="">
        {formatClock(remainingMs(progress, at))}
      </p>
      {status ? (
        <p className={styles.clockStatus} data-cw-route-clock-status="">
          {status}
        </p>
      ) : null}
    </div>
  )
}
