import type { CSSProperties } from 'react'
import { clampLevel } from '../format'
import styles from './About.module.scss'

export function LevelBar({ value, label }: { value: number; label: string }) {
  const level = clampLevel(value)
  return (
    <div className={styles.level}>
      <span className={styles.track} data-cw-glass="subtle" aria-hidden="true">
        <span className={styles.fill} style={{ '--cw-level': level / 100 } as CSSProperties} />
      </span>
      <span className={styles.levelValue}>{label}</span>
    </div>
  )
}
