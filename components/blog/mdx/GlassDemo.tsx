'use client'

import { useId, useState } from 'react'
import { cx } from '@/components/ui/cx'
import type { GlassVariant } from '@/components/ui/GlassSurface'
import styles from './GlassDemo.module.scss'

export type GlassDemoLabels = {
  title: string
  legend: string
  subtle: string
  standard: string
  strong: string
  motion: string
  sample: string
}

const VARIANTS: readonly GlassVariant[] = ['subtle', 'standard', 'strong']

export function GlassDemo({ labels, initial = 'standard' }: { labels?: GlassDemoLabels; initial?: GlassVariant }) {
  const id = useId()
  const [variant, setVariant] = useState<GlassVariant>(initial)
  const [moving, setMoving] = useState(true)

  if (!labels) return null

  const titleId = `${id}-title`
  const sample = labels.sample.replace('{variant}', labels[variant].toLocaleLowerCase())

  return (
    <figure className={styles.demo} aria-labelledby={titleId} data-cw-glass-demo={variant}>
      <figcaption id={titleId} className={styles.title}>
        {labels.title}
      </figcaption>
      <div className={cx(styles.stage, moving && styles.moving)}>
        <span className={cx(styles.blob, styles.blobA)} aria-hidden="true" />
        <span className={cx(styles.blob, styles.blobB)} aria-hidden="true" />
        <span className={cx(styles.blob, styles.blobC)} aria-hidden="true" />
        <p className={cx(styles.panel, styles[variant])} data-cw-glass={variant} aria-live="polite">
          {sample}
        </p>
      </div>
      <div className={styles.controls}>
        <fieldset className={styles.variants}>
          <legend className={styles.legend}>{labels.legend}</legend>
          {VARIANTS.map((value) => (
            <label key={value} className={styles.option}>
              <input
                type="radio"
                name={`${id}-variant`}
                value={value}
                checked={variant === value}
                onChange={() => setVariant(value)}
              />
              <span>{labels[value]}</span>
            </label>
          ))}
        </fieldset>
        <label className={styles.option}>
          <input type="checkbox" checked={moving} onChange={(event) => setMoving(event.target.checked)} />
          <span>{labels.motion}</span>
        </label>
      </div>
    </figure>
  )
}
