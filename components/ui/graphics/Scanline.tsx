import type { CSSProperties } from 'react'
import { cx } from '../cx'
import styles from './graphics.module.scss'

export type ScanlineProps = {
  axis?: 'x' | 'y'
  edge?: 'top' | 'bottom'
  delay?: number
  className?: string
}

export function Scanline({ axis = 'x', edge = 'bottom', delay = 0, className }: ScanlineProps) {
  return (
    <span
      aria-hidden="true"
      data-cw-graphic="scanline"
      className={cx(
        styles.layer,
        styles.scan,
        axis === 'x' ? styles.scanX : styles.scanY,
        axis === 'x' && edge === 'top' && styles.scanTop,
        className,
      )}
      style={delay > 0 ? ({ '--_delay': `${Math.round(delay)}ms` } as CSSProperties) : undefined}
    />
  )
}
