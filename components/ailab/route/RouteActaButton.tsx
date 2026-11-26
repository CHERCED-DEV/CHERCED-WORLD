'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { downloadText } from '@/lib/ailab/skill/download'
import type { RouteProofView } from '@/lib/ailab/route/view'
import { useRoute } from './RouteView'
import styles from './RouteView.module.scss'

export type RouteActaLabels = { download: string; hint: string; failed: string; file: string }

export function RouteActaButton({ labels, proofs }: { labels: RouteActaLabels; proofs: readonly RouteProofView[] }) {
  const route = useRoute()
  const hintId = useId()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const download = async () => {
    setBusy(true)
    setFailed(false)
    try {
      const { routeActa, routeActaFileName } = await import('@/lib/ailab/route/acta')
      const now = Date.now()
      const text = routeActa({ lang: route.lang, stations: route.stations, proofs, progress: route.progress, origin: window.location.origin, now })
      downloadText(routeActaFileName(labels.file, now), text)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.acta}>
      <Button variant="glass" onClick={download} disabled={!route.ready || busy} aria-describedby={hintId} data-cw-route-acta="">
        {labels.download}
      </Button>
      <p id={hintId} className="cw-visually-hidden">
        {labels.hint}
      </p>
      {failed ? (
        <p className={styles.actaError} role="alert">
          {labels.failed}
        </p>
      ) : null}
    </div>
  )
}
