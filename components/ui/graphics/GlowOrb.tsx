import type { CSSProperties } from 'react'
import { cx } from '../cx'
import styles from './graphics.module.scss'

export type GlowOrbProps = {
  tone?: 'accent' | 'fg'
  size?: 'sm' | 'md' | 'lg'
  x?: string
  y?: string
  pulse?: boolean
  className?: string
}

const SIZES = { sm: styles.orbSm, md: undefined, lg: styles.orbLg } as const

export function GlowOrb({ tone = 'accent', size = 'md', x = '50%', y = '50%', pulse = false, className }: GlowOrbProps) {
  return (
    <span aria-hidden="true" data-cw-graphic="orb" className={cx(styles.layer, className)}>
      <span
        className={cx(styles.orb, tone === 'fg' && styles.orbFg, SIZES[size], pulse && styles.pulse)}
        style={{ '--_x': x, '--_y': y } as CSSProperties}
      />
    </span>
  )
}
