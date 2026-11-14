import type { LabExperiment } from '@/content/types'
import { cx } from '@/components/ui/cx'
import styles from './LabCard.module.scss'
import { LabIcon } from './LabIcon'

export type RunsInBadgeProps = { runsIn: LabExperiment['runsIn']; label: string; className?: string }

export function RunsInBadge({ runsIn, label, className }: RunsInBadgeProps) {
  return (
    <span className={cx(styles.badge, styles.runs, className)} data-cw-lab-runs={runsIn}>
      <LabIcon name={runsIn === 'google' ? 'cloud' : 'browser'} size={14} className={styles.badgeIcon} />
      {label}
    </span>
  )
}
