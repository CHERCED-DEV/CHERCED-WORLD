import styles from './ScrollJourney.module.scss'

export function ScrollProgress() {
  return <div className={styles.progress} aria-hidden="true" data-cw-scroll-progress="" />
}
