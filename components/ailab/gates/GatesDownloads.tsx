'use client'

import { useId, useState } from 'react'
import { updateRouteProgress, useHydrated, useRouteProgress } from '@/components/ailab/route/use-route-progress'
import { Button } from '@/components/ui/Button'
import { actaSummary, appendNote, GATES_STATION_ID, REVISION_FILE, revisionFile, SPEC_FILE, specFile } from '@/lib/ai/gates/export'
import type { GateDecision, GateRun } from '@/lib/ai/gates/schema'
import { isRouteStarted, setNote } from '@/lib/ailab/route/progress'
import type { Locale } from '@/lib/i18n/config'
import { gatesText, type GatesCopyKey } from './copy'
import styles from './GatesStage.module.scss'

export function downloadText(name: string, text: string, type: string): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([text], { type }))
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}

export type GatesDownloadsProps = { lang: Locale; run: GateRun; decision: GateDecision | null }

export function GatesDownloads({ lang, run, decision }: GatesDownloadsProps) {
  const text = gatesText(lang)
  const id = useId()
  const hydrated = useHydrated()
  const progress = useRouteProgress()
  const [acta, setActa] = useState<'idle' | 'added' | 'failed'>('idle')
  const started = hydrated && isRouteStarted(progress)

  const addToActa = () => {
    try {
      const summary = actaSummary({ lang, run, decision, template: text('gates.download.acta.summary'), stopText: text(`gates.stop.${run.stop}` as GatesCopyKey) })
      updateRouteProgress((current) => setNote(current, GATES_STATION_ID, appendNote(current.notes[GATES_STATION_ID], summary)))
      setActa('added')
    } catch {
      setActa('failed')
    }
  }

  return (
    <section className={styles.downloads} aria-labelledby={`${id}-title`} data-cw-gates-downloads="">
      <h5 id={`${id}-title`} className={styles.subtitle}>
        {text('gates.download.title')}
      </h5>
      <div className={styles.row}>
        <Button variant="glass" size="sm" onClick={() => downloadText(SPEC_FILE, specFile(run), 'text/markdown')} data-cw-gates-download="spec">
          {text('gates.download.spec')}
        </Button>
        <Button
          variant="glass"
          size="sm"
          onClick={() => decision && downloadText(REVISION_FILE, revisionFile(run, decision), 'application/json')}
          disabled={!decision}
          aria-describedby={decision ? undefined : `${id}-hint`}
          data-cw-gates-download="revision"
        >
          {text('gates.download.revision')}
        </Button>
      </div>
      {decision ? null : (
        <p id={`${id}-hint`} className={styles.hint}>
          {text('gates.download.revisionHint')}
        </p>
      )}
      <p className={styles.muted}>{started ? text('gates.download.acta.hint') : text('gates.download.acta.none')}</p>
      {started ? (
        <Button variant="ghost" size="sm" onClick={addToActa} data-cw-gates-acta="">
          {text('gates.download.acta.add')}
        </Button>
      ) : null}
      <p className={styles.status} role="status" aria-live="polite">
        {acta === 'added' ? text('gates.download.acta.added') : acta === 'failed' ? text('gates.download.acta.failed') : ''}
      </p>
    </section>
  )
}
