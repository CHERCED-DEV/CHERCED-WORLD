import type { LabExperiment } from '@/content/types'
import { cx } from '@/components/ui/cx'
import styles from './LabCard.module.scss'

export type RunsInBadgeProps = { runsIn: LabExperiment['runsIn']; label: string; className?: string }

export function RunsInBadge({ runsIn, label, className }: RunsInBadgeProps) {
  return (
    <span className={cx(styles.badge, styles.runs, className)} data-cw-lab-runs={runsIn}>
      <svg className={styles.badgeIcon} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3" y="4" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M3 8h18M8 21h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label}
    </span>
  )
}
