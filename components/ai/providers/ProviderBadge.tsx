import { cx } from '@/components/ui/cx'
import styles from './Providers.module.scss'

export type ProviderBadgeId = 'gemini' | 'claude' | 'openai' | 'simulator'

export type ProviderBadgeProps = { provider: ProviderBadgeId; label: string; detail?: string; className?: string }

export function ProviderBadge({ provider, label, detail, className }: ProviderBadgeProps) {
  return (
    <span className={cx(styles.badge, className)} data-cw-provider={provider}>
      <span className={styles.mark} aria-hidden="true" />
      <span>{label}</span>
      {detail ? <span className={styles.detail}>{detail}</span> : null}
    </span>
  )
}
