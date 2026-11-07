import type { Locale } from '@/lib/i18n/config'
import { typeset } from '../typeset'
import styles from './About.module.scss'

export type JobSummaryProps = { id?: string; lang: Locale; description: string; highlights: readonly string[] }

export function JobSummary({ id, lang, description, highlights }: JobSummaryProps) {
  if (highlights.length === 0) {
    return (
      <p id={id} className={styles.jobText}>
        {typeset(description, lang)}
      </p>
    )
  }
  return (
    <ul id={id} className={styles.jobHighlights} data-cw-job-highlights="">
      {highlights.map((highlight) => (
        <li key={highlight}>{typeset(highlight, lang)}</li>
      ))}
    </ul>
  )
}
