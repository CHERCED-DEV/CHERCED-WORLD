import type { JSX } from 'react'
import { cx } from '@/components/ui/cx'
import styles from './Loaders.module.scss'

export type LoaderSize = 'sm' | 'md' | 'lg'

export type LoaderProps = { label: string; size?: LoaderSize }

export function AtomLoader({ label, size = 'md' }: LoaderProps): JSX.Element {
  return (
    <span role="status" className={cx(styles.loader, styles[size])} data-cw-loader="atom">
      <span className={styles.atom} aria-hidden="true">
        <span className={styles.electron} />
        <span className={styles.electron} />
        <span className={styles.electron} />
      </span>
      <span className="cw-visually-hidden">{label}</span>
    </span>
  )
}

export function DotsLoader({ label, size = 'md' }: LoaderProps): JSX.Element {
  return (
    <span role="status" className={cx(styles.loader, styles[size])} data-cw-loader="dots">
      <span className={styles.devices} aria-hidden="true">
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
      <span className="cw-visually-hidden">{label}</span>
    </span>
  )
}
