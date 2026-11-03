import { cx } from '@/components/ui/cx'
import styles from './Home.module.scss'

export function ScrollCue({ href, label, className }: { href: `#${string}`; label: string; className?: string }) {
  return (
    <a href={href} className={cx(styles.cue, className)} aria-label={label} data-cw-home-cue="">
      <span className={styles.cueLine} aria-hidden="true" />
      <svg className={styles.cueIcon} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M6 9.5l6 6 6-6" />
      </svg>
    </a>
  )
}
