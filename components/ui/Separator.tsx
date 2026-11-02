import { cx } from './cx'
import styles from './Separator.module.scss'

export type SeparatorTone = 'light' | 'dark'

export function Separator({ tone, className }: { tone?: SeparatorTone; className?: string }) {
  return <hr aria-hidden="true" className={cx(styles.separator, tone && styles[tone], className)} />
}
