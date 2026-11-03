import styles from './HeroOrbit.module.scss'

export function HeroOrbit() {
  return (
    <div className={styles.orbit} aria-hidden="true" data-cw-home-orbit="">
      <svg className={styles.rings} viewBox="-500 -500 1000 1000" focusable="false">
        <ellipse className={styles.ring} rx="490" ry="116" transform="rotate(-9)" vectorEffect="non-scaling-stroke" />
        <ellipse className={styles.faint} rx="440" ry="150" transform="rotate(12)" vectorEffect="non-scaling-stroke" />
        <ellipse className={styles.dashed} rx="380" ry="62" transform="rotate(-2)" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className={styles.track}>
        <span className={styles.electron} />
      </span>
      <span className={styles.trackAlt}>
        <span className={styles.electronAlt} />
      </span>
    </div>
  )
}
