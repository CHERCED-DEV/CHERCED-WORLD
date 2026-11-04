import { cx } from '../cx'
import styles from './graphics.module.scss'

export type HairlineProps = {
  orientation?: 'horizontal' | 'vertical'
  glint?: boolean
  className?: string
}

export function Hairline({ orientation = 'horizontal', glint = false, className }: HairlineProps) {
  return (
    <span
      aria-hidden="true"
      data-cw-graphic="hairline"
      className={cx(styles.hairline, orientation === 'vertical' && styles.vertical, glint && styles.glint, className)}
    />
  )
}
