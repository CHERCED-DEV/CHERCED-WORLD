'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { GlassSurface } from '@/components/ui/GlassSurface'
import type { ServiceId } from '@/content/types'
import { ServiceIcon } from './ServiceIcon'
import styles from './Services.module.scss'

export type ServiceCardLabels = {
  forWho: string
  deliverables: string
  flip: string
  flipBack: string
  want: string
  try: string
}

export type ServiceCardProps = {
  id: ServiceId
  number: string
  title: string
  forWho: string
  description: string
  example?: string
  deliverables: string[]
  wantHref: string
  tryHref?: string
  labels: ServiceCardLabels
}

const HOVER_INTENT_MS = 150

function selectingText(): boolean {
  return (window.getSelection?.()?.toString() ?? '') !== ''
}

export function ServiceCard({
  id,
  number,
  title,
  forWho,
  description,
  example,
  deliverables,
  wantHref,
  tryHref,
  labels,
}: ServiceCardProps) {
  const [flipped, setFlipped] = useState(false)
  const hover = useRef<number | undefined>(undefined)
  const base = useId()
  const titleId = `${base}-title`
  const backId = `${base}-back`

  useEffect(() => () => window.clearTimeout(hover.current), [])

  const onPointerEnter = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return
    window.clearTimeout(hover.current)
    hover.current = window.setTimeout(() => setFlipped(true), HOVER_INTENT_MS)
  }
  const onPointerLeave = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'mouse') return
    window.clearTimeout(hover.current)
    setFlipped(false)
  }
  const onCardClick = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as Element).closest('a, button') || selectingText()) return
    setFlipped((value) => !value)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && flipped) setFlipped(false)
  }

  return (
    <GlassSurface
      as="article"
      variant="standard"
      grain
      depth
      edge
      light
      className={styles.card}
      aria-labelledby={titleId}
      data-cw-service={id}
      data-cw-flipped={flipped ? 'true' : 'false'}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClick={onCardClick}
      onKeyDown={onKeyDown}
    >
      <div className={styles.cardHead}>
        <span className={styles.cardTile}>
          <ServiceIcon id={id} />
        </span>
        <p className={styles.cardIndex} aria-hidden="true">
          {number}
        </p>
        <h3 id={titleId} className={styles.cardTitle}>
          {title}
        </h3>
      </div>
      <div className={styles.cardFaces}>
        <div className={styles.cardInner}>
          <div className={styles.cardFront} data-cw-face="front">
            <dl className={styles.forWho}>
              <dt className={styles.faceLabel}>{labels.forWho}</dt>
              <dd>{forWho}</dd>
            </dl>
            <p className={styles.cardText}>{description}</p>
            {example ? <p className={styles.cardExample}>{example}</p> : null}
          </div>
          <div id={backId} className={styles.cardBack} data-cw-face="back">
            <h4 className={styles.faceLabel}>{labels.deliverables}</h4>
            <ul className={styles.deliverables}>
              {deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className={styles.cardActions}>
        <button
          type="button"
          className={cx(buttonClassName({ variant: 'glass', size: 'sm' }), styles.flip, 'cw-js-only')}
          aria-expanded={flipped}
          aria-controls={backId}
          aria-describedby={titleId}
          data-cw-service-flip=""
          onClick={() => setFlipped((value) => !value)}
        >
          {flipped ? labels.flipBack : labels.flip}
        </button>
        {tryHref ? (
          <Link
            href={tryHref}
            className={buttonClassName({ variant: 'glass', size: 'sm' })}
            aria-label={`${labels.try}: ${title}`}
            data-cw-service-try={id}
          >
            {labels.try}
          </Link>
        ) : null}
        <Link
          href={wantHref}
          className={buttonClassName({ variant: 'solid', size: 'sm' })}
          aria-label={`${labels.want}: ${title}`}
          data-cw-service-want={id}
        >
          {labels.want}
        </Link>
      </div>
    </GlassSurface>
  )
}
