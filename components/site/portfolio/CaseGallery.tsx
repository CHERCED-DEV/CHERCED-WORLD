'use client'

import Image from 'next/image'
import { useId, useState, ViewTransition, type CSSProperties, type KeyboardEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { fillTemplate, indexForKey, wrapIndex } from './carousel'
import styles from './CaseGallery.module.scss'
import { PortfolioIcon } from './PortfolioIcon'

export type GalleryImage = { src: string; alt: string; width: number; height: number }

export type GalleryLabels = {
  zoom: string
  close: string
  prev: string
  next: string
  counter: string
  thumb: string
}

export type CaseGalleryProps = {
  images: GalleryImage[]
  labels: GalleryLabels
  title: string
  transitionName?: string
}

function ratioStyle(image: GalleryImage): CSSProperties {
  return { '--cw-media-ratio': (image.width / image.height).toFixed(4) } as CSSProperties
}

export function CaseGallery({ images, labels, title, transitionName }: CaseGalleryProps) {
  const uid = useId().replace(/:/g, '')
  const titleId = `${uid}-title`
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)
  const total = images.length
  const shown = images[current] ?? images[0]
  if (!shown) return null
  const many = total > 1

  const move = (target: number) => setCurrent(wrapIndex(target, total))

  const onLightboxKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!many || event.altKey || event.ctrlKey || event.metaKey) return
    const next = indexForKey(event.key, current, total)
    if (next === null) return
    event.preventDefault()
    setCurrent(next)
  }

  return (
    <div className={styles.gallery} data-cw-gallery="" data-count={total}>
      <figure
        className={styles.main}
        data-orientation={shown.width >= shown.height ? 'landscape' : 'portrait'}
        style={ratioStyle(shown)}
      >
        <div className={styles.stage}>
          <ViewTransition name={current === 0 && transitionName ? transitionName : undefined} share="auto" default="none">
            <Image
              key={shown.src}
              src={shown.src}
              alt={shown.alt}
              width={shown.width}
              height={shown.height}
              sizes={shown.width >= shown.height ? '(min-width: 992px) 640px, 92vw' : '(min-width: 768px) 280px, 220px'}
              preload={current === 0}
              className={styles.image}
            />
          </ViewTransition>
          <button
            type="button"
            className={cx('cw-js-only', styles.zoom)}
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            data-cw-gallery-zoom=""
          >
            <span className={styles.zoomBadge} aria-hidden="true">
              <PortfolioIcon name="zoom" />
            </span>
            <span className="cw-visually-hidden">
              {labels.zoom}: {shown.alt}
            </span>
          </button>
        </div>
      </figure>

      {many ? (
        <ul className={cx('cw-js-only', styles.thumbs)}>
          {images.map((image, index) => (
            <li key={image.src}>
              <button
                type="button"
                className={styles.thumb}
                aria-pressed={index === current}
                aria-label={fillTemplate(labels.thumb, { n: index + 1, total })}
                onClick={() => setCurrent(index)}
                data-cw-gallery-thumb={index}
              >
                <Image src={image.src} alt="" width={image.width} height={image.height} sizes="96px" className={styles.thumbImage} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {many ? (
        <ul className={styles.noJsList}>
          {images.slice(1).map((image) => (
            <li key={image.src}>
              <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(min-width: 768px) 480px, 92vw" />
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} className={styles.lightbox}>
        <div className={styles.lightboxBody} onKeyDown={onLightboxKey} data-cw-gallery-lightbox="">
          <div className={styles.lightboxBar}>
            <p id={titleId} className={styles.lightboxTitle}>
              {title}
              {many ? <span className={styles.lightboxCounter}>{fillTemplate(labels.counter, { n: current + 1, total })}</span> : null}
            </p>
            <button type="button" className={styles.iconButton} aria-label={labels.close} onClick={() => setOpen(false)} data-cw-gallery-close="">
              <Icon name="close" size={18} />
            </button>
          </div>
          <figure className={styles.lightboxFigure}>
            {open ? (
              <Image
                key={shown.src}
                src={shown.src}
                alt={shown.alt}
                width={shown.width}
                height={shown.height}
                sizes="(min-width: 1200px) 1200px, 100vw"
                loading="eager"
                className={styles.lightboxImage}
                style={{ '--cw-natural-h': `${shown.height}px` } as CSSProperties}
              />
            ) : null}
            <figcaption className={styles.caption}>{shown.alt}</figcaption>
          </figure>
          {many ? (
            <div className={styles.lightboxNav}>
              <button type="button" className={styles.iconButton} aria-label={labels.prev} onClick={() => move(current - 1)} data-cw-gallery-prev="">
                <PortfolioIcon name="arrow-left" />
              </button>
              <button type="button" className={styles.iconButton} aria-label={labels.next} onClick={() => move(current + 1)} data-cw-gallery-next="">
                <PortfolioIcon name="arrow-right" />
              </button>
            </div>
          ) : null}
        </div>
      </Dialog>
    </div>
  )
}
