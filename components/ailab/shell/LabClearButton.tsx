'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { useToast } from '@/components/ui/Toast'
import { clearAll } from '@/lib/ailab/core/store'
import styles from './LabPage.module.scss'
import type { LabClearLabels } from './types'

export function LabClearButton({ labels }: { labels: LabClearLabels }) {
  const toast = useToast()
  const hintId = useId()
  const [busy, setBusy] = useState(false)

  const clear = async () => {
    if (busy) return
    setBusy(true)
    try {
      const result = await clearAll()
      if (result.complete) toast.success(labels.done)
      else toast.error(labels.partial)
    } catch {
      toast.error(labels.partial)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={cx(styles.clear, 'cw-js-only')}>
      <Button
        variant="glass"
        size="sm"
        className={styles.clearButton}
        onClick={clear}
        aria-describedby={hintId}
        aria-busy={busy || undefined}
        data-cw-lab-clear=""
      >
        {labels.clear}
      </Button>
      <p id={hintId} className={styles.clearHint}>
        {labels.hint}
      </p>
    </div>
  )
}
