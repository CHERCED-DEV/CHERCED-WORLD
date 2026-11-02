import styles from './Atom.module.scss'

export function Atom() {
  return (
    <div className={styles.container} aria-hidden="true" data-cw-atom="">
      <div className={styles.atom}>
        <span className={styles.electron} />
        <span className={styles.electron} />
        <span className={styles.electron} />
      </div>
    </div>
  )
}
