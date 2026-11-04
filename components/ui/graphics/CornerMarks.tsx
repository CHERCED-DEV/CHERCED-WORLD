import type { CSSProperties } from 'react'
import { cx } from '../cx'
import styles from './graphics.module.scss'

export type CornerMarksProps = {
  size?: number
  inset?: number
  accent?: boolean
  className?: string
}

export function CornerMarks({ size, inset, accent = false, className }: CornerMarksProps) {
  const vars: Record<string, string> = {}
  if (size !== undefined) vars['--_size'] = `${size}px`
  if (inset !== undefined) vars['--_inset'] = `${inset}px`
  return (
    <span
      aria-hidden="true"
      data-cw-graphic="corners"
      className={cx(styles.corners, accent && styles.cornersAccent, className)}
      style={Object.keys(vars).length > 0 ? (vars as CSSProperties) : undefined}
    />
  )
}
