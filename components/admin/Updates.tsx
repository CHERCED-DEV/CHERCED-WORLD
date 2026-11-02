'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useEffectEvent, useState } from 'react'
import { useHydrated } from '@/components/contact/useHydrated'
import styles from './admin.module.scss'
import { createPoller, hasNewArrivals, UPDATES_ENDPOINT, type Counts, type PollStatus } from './poller'

export type UpdatesLabels = { live: string; reconnecting: string; newActivity: string; ended: string }

export type UpdatesProps = { initialNow: string; unread: number; pending: number; labels: UpdatesLabels }

async function fetchUpdates(since: string, signal: AbortSignal) {
  const response = await fetch(`${UPDATES_ENDPOINT}?since=${encodeURIComponent(since)}`, {
    cache: 'no-store',
    credentials: 'same-origin',
    signal,
  })
  const body: unknown = response.status === 200 ? await response.json() : null
  return { status: response.status, body }
}

export function Updates({ initialNow, unread, pending, labels }: UpdatesProps) {
  const router = useRouter()
  const [status, setStatus] = useState<PollStatus>('live')
  const [announcement, setAnnouncement] = useState('')
  const [initial] = useState(() => ({ since: initialNow, unread, pending }))
  const hydrated = useHydrated()

  const onChange = useEffectEvent((counts: Counts, previous: Counts) => {
    if (hasNewArrivals(counts, previous)) {
      setAnnouncement((current) => (current === labels.newActivity ? `${labels.newActivity}\u00a0` : labels.newActivity))
    }
    router.refresh()
  })

  const onEnded = useEffectEvent(() => {
    router.refresh()
  })

  useEffect(() => {
    const poller = createPoller(
      {
        fetchUpdates,
        isVisible: () => document.visibilityState === 'visible',
        setTimer: (run, ms) => window.setTimeout(run, ms),
        clearTimer: (handle) => window.clearTimeout(handle as number),
        onStatus: setStatus,
        onChange: (counts, previous) => onChange(counts, previous),
        onEnded: () => onEnded(),
      },
      initial,
    )
    const onVisibility = () => poller.visibilityChanged()
    const onOnline = () => poller.pollNow()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    poller.start()
    return () => {
      poller.stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
    }
  }, [initial])

  const text = status === 'live' ? labels.live : status === 'reconnecting' ? labels.reconnecting : labels.ended

  return (
    <>
      <span className={styles.live} role="status" data-cw-updates={status} data-cw-hydrated={hydrated ? '' : undefined}>
        {text}
      </span>
      <span className={styles.srOnly} aria-live="polite" data-cw-updates-announcer="">
        {announcement}
      </span>
    </>
  )
}
