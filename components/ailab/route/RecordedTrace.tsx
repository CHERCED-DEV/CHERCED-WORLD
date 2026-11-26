'use client'

import { TracePanel } from '@/components/ailab/agent/TracePanel'
import type { AgentTraceCopy } from '@/content/ailab/agent'
import type { Trace } from '@/lib/ai/agent/trace'
import type { Locale } from '@/lib/i18n/config'
import type { RecordedTraceLabels } from './labels'
import styles from './StationCard.module.scss'

type Props = { lang: Locale; trace: Trace; copy: AgentTraceCopy; labels: RecordedTraceLabels }

export function RecordedTrace({ lang, trace, copy, labels }: Props) {
  return (
    <div className={styles.recorded} data-cw-route-recorded={trace.mode}>
      <p className={styles.recordedTitle}>{labels.summary}</p>
      <p className={styles.hint}>{labels.note}</p>
      <TracePanel trace={trace} copy={copy} lang={lang} />
    </div>
  )
}
