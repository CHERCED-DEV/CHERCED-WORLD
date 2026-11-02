import Link from 'next/link'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Separator } from '@/components/ui/Separator'
import styles from './StatusView.module.scss'

export function NotFoundView({ title, ctaLabel, href }: { title: string; ctaLabel: string; href: string }) {
  return (
    <section className={cx('cw-container', styles.wrap)} data-cw-not-found="">
      <GlassSurface variant="standard" className={styles.card}>
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 className={styles.title}>{title}</h1>
        <Separator />
        <Link href={href} className={buttonClassName({ variant: 'solid' })}>
          {ctaLabel}
        </Link>
      </GlassSurface>
    </section>
  )
}
