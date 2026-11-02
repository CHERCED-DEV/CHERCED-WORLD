'use client'

import { Button, buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { Separator } from '@/components/ui/Separator'
import styles from './StatusView.module.scss'

export type ErrorViewProps = {
  title: string
  retryLabel: string
  onRetry: () => void
  homeLabel: string
  homeHref: string
}

export function ErrorView({ title, retryLabel, onRetry, homeLabel, homeHref }: ErrorViewProps) {
  return (
    <main id="main" className={cx('cw-container', styles.wrap)}>
      <GlassSurface variant="standard" className={styles.card}>
        <p className={styles.code} aria-hidden="true">
          500
        </p>
        <h1 className={styles.title}>{title}</h1>
        <Separator />
        <div className={styles.actions}>
          <Button variant="solid" onClick={onRetry}>
            {retryLabel}
          </Button>
          <a href={homeHref} className={buttonClassName({ variant: 'ghost' })}>
            {homeLabel}
          </a>
        </div>
      </GlassSurface>
    </main>
  )
}
