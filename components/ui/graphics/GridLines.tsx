import type { CSSProperties } from 'react'
import { cx } from '../cx'
import styles from './graphics.module.scss'

export type GraphicFade = 'radial' | 'top' | 'bottom' | 'none'

export type GridLinesProps = {
  cell?: number
  fade?: GraphicFade
  accent?: boolean
  className?: string
}

const FADES: Record<GraphicFade, string | undefined> = {
  radial: styles.fadeRadial,
  top: styles.fadeTop,
  bottom: styles.fadeBottom,
  none: undefined,
}

export function GridLines({ cell, fade = 'radial', accent = false, className }: GridLinesProps) {
  const style = cell ? ({ '--_cell': `${cell}px` } as CSSProperties) : undefined
  return (
    <span
      aria-hidden="true"
      data-cw-graphic="grid"
      className={cx(styles.layer, styles.grid, accent && styles.gridAccent, FADES[fade], className)}
      style={style}
    />
  )
}
