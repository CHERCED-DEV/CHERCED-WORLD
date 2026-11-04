import { GridLines } from '@/components/ui/graphics'
import { Atom } from './Atom'
import styles from './BlogIntro.module.scss'

export function BlogIntro({ title, titleStrong, welcome }: { title: string; titleStrong: string; welcome: string }) {
  return (
    <section className={styles.intro} aria-labelledby="cw-blog-title">
      <GridLines fade="radial" />
      <h1 id="cw-blog-title" className={styles.title}>
        <span>{title}</span> <strong>{titleStrong}</strong>
      </h1>
      <p className={styles.welcome}>{welcome}</p>
      <Atom />
    </section>
  )
}
