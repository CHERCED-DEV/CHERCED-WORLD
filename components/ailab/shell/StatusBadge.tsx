import type { LabStatus } from '@/content/types'
import { cx } from '@/components/ui/cx'
import styles from './LabCard.module.scss'

export type StatusBadgeProps = { status: LabStatus; label: string; prefix: string; className?: string }

export function StatusBadge({ status, label, prefix, className }: StatusBadgeProps) {
  return (
    <span className={cx(styles.badge, styles.status, className)} data-cw-lab-status={status}>
      <span className={styles.dot} aria-hidden="true" />
      <span className="cw-visually-hidden">{prefix}: </span>
      {label}
    </span>
  )
}
