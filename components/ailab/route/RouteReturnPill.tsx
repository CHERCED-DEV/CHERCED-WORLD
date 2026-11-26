'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatClock, pillVisible, remainingMs, setPill, type RouteProgress } from '@/lib/ailab/route/progress'
import { localizedPath } from '@/lib/i18n/paths'
import type { Locale } from '@/lib/i18n/config'
import type { RoutePillLabels } from './labels'
import { updateRouteProgress, useRouteProgress } from './use-route-progress'
import styles from './RouteReturnPill.module.scss'

type ViewProps = { lang: Locale; labels: RoutePillLabels; progress: RouteProgress; now: number; onClose: () => void }

export function RouteReturnPillView({ lang, labels, progress, now, onClose }: ViewProps) {
  const href = `${localizedPath(lang, '/ai-lab/ruta')}${progress.active ? `#estacion-${progress.active}` : ''}`
  const left = remainingMs(progress, now)
  return (
    <aside className={styles.pill} aria-label={labels.region} data-cw-route-pill="" data-over={left < 0 ? '' : undefined}>
      <Link href={href} className={styles.back} prefetch={false} data-cw-route-pill-link="">
        <span>{labels.label}</span>
        <span className={styles.time}>({formatClock(left)})</span>
      </Link>
      <button type="button" className={styles.close} onClick={onClose} aria-label={labels.close} data-cw-route-pill-close="">
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  )
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    const first = window.setTimeout(tick, 0)
    const timer = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [active])
  return now
}

export function RouteReturnPill({ lang, labels }: { lang: Locale; labels: RoutePillLabels }) {
  const progress = useRouteProgress()
  const pathname = usePathname() ?? ''
  const visible = pillVisible(progress, pathname)
  const now = useNow(visible)
  if (!visible) return null
  return <RouteReturnPillView lang={lang} labels={labels} progress={progress} now={now} onClose={() => updateRouteProgress((current) => setPill(current, false))} />
}
