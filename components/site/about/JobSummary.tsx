import styles from './About.module.scss'

export type JobSummaryProps = { id?: string; description: string; highlights: readonly string[] }

export function JobSummary({ id, description, highlights }: JobSummaryProps) {
  if (highlights.length === 0) {
    return (
      <p id={id} className={styles.jobText}>
        {description}
      </p>
    )
  }
  return (
    <ul id={id} className={styles.jobHighlights} data-cw-job-highlights="">
      {highlights.map((highlight) => (
        <li key={highlight}>{highlight}</li>
      ))}
    </ul>
  )
}
