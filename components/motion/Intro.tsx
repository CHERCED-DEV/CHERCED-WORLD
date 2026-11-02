import type { JSX } from 'react'
import { introScript } from '@/lib/motion/intro'
import styles from './Intro.module.scss'

export type IntroProps = { name: string; role: string; skipLabel: string }

export function Intro({ name, role, skipLabel }: IntroProps): JSX.Element {
  return (
    <>
      <div className={styles.intro} role="status" data-cw-intro="">
        <div className={styles.box}>
          <p className={styles.title}>
            <span className={styles.titleBlock} aria-hidden="true" />
            <span className={styles.name}>
              {name}
              <span className={styles.dot} aria-hidden="true" />
            </span>
          </p>
          <p className={styles.role}>
            <span className={styles.roleBlock} aria-hidden="true" />
            <span className={styles.roleText}>{role}</span>
          </p>
        </div>
        <p className={styles.skip} aria-hidden="true">
          {skipLabel}
        </p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: introScript }} />
    </>
  )
}
