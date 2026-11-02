'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import {
  fillTemplate,
  filterByTechnology,
  filterSummary,
  indexForKey,
  nearestIndex,
  wrapIndex,
  type SlideProject,
} from './carousel'
import styles from './Portfolio.module.scss'

export type ExplorerLabels = {
  filter: string
  filterAll: string
  carousel: string
  carouselHint: string
  slide: string
  prev: string
  next: string
  current: string
  filteredAll: string
  filteredOne: string
  filteredMany: string
  viewCase: string
  technologies: string
}

export type ProjectsExplorerProps = {
  projects: SlideProject[]
  technologies: string[]
  labels: ExplorerLabels
}

const SETTLE_MS = 120

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function ProjectsExplorer({ projects, technologies, labels }: ProjectsExplorerProps) {
  const currentTemplate = labels.current
  const [tech, setTech] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const trackRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)
  const settleRef = useRef<number | undefined>(undefined)
  const uid = useId().replace(/:/g, '')
  const hintId = `${uid}-hint`
  const filterId = `${uid}-filter`

  const visible = useMemo(() => filterByTechnology(projects, tech), [projects, tech])
  const total = visible.length

  const announceSlide = useCallback(
    (next: number) => {
      const project = visible[next]
      if (!project) return
      setAnnouncement(fillTemplate(currentTemplate, { n: next + 1, total, title: project.title }))
    },
    [currentTemplate, total, visible],
  )

  const select = useCallback(
    (next: number) => {
      indexRef.current = next
      setIndex(next)
      announceSlide(next)
    },
    [announceSlide],
  )

  const goTo = useCallback(
    (target: number) => {
      const next = wrapIndex(target, total)
      select(next)
      const track = trackRef.current
      const slide = track?.children[next] as HTMLElement | undefined
      if (track && slide) track.scrollTo({ left: slide.offsetLeft, behavior: scrollBehavior() })
    },
    [select, total],
  )

  useEffect(() => {
    indexRef.current = 0
    trackRef.current?.scrollTo({ left: 0 })
  }, [tech])

  useEffect(() => () => window.clearTimeout(settleRef.current), [])

  const onScroll = () => {
    window.clearTimeout(settleRef.current)
    settleRef.current = window.setTimeout(() => {
      const track = trackRef.current
      if (!track) return
      const next = nearestIndex(track.scrollLeft, track.clientWidth, total)
      if (next !== indexRef.current) select(next)
    }, SETTLE_MS)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const next = indexForKey(event.key, indexRef.current, total)
    if (next === null) return
    event.preventDefault()
    goTo(next)
  }

  const chooseTech = (value: string | null) => {
    if (value === tech) return
    const count = filterByTechnology(projects, value).length
    setTech(value)
    setIndex(0)
    setAnnouncement(filterSummary(labels, count, value))
  }

  return (
    <div className={styles.explorer} data-cw-projects="">
      <div className={cx('cw-js-only', styles.filter)} role="group" aria-labelledby={filterId}>
        <p id={filterId} className={styles.filterLabel}>
          {labels.filter}
        </p>
        <ul className={styles.filterList}>
          <li>
            <button
              type="button"
              className={styles.chipButton}
              aria-pressed={tech === null}
              onClick={() => chooseTech(null)}
              data-cw-filter=""
            >
              {labels.filterAll}
            </button>
          </li>
          {technologies.map((item) => (
            <li key={item}>
              <button
                type="button"
                className={styles.chipButton}
                aria-pressed={tech === item}
                onClick={() => chooseTech(item)}
                data-cw-filter={item}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p id={hintId} className="cw-visually-hidden">
        {labels.carouselHint}
      </p>
      <div
        ref={trackRef}
        className={styles.track}
        role="region"
        aria-roledescription="carousel"
        aria-label={labels.carousel}
        aria-describedby={hintId}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        data-cw-carousel=""
      >
        {visible.map((project, position) => (
          <div
            key={project.id}
            role="group"
            aria-roledescription="slide"
            aria-label={fillTemplate(labels.slide, { n: position + 1, total })}
            className={styles.slide}
            data-cw-slide={project.id}
            data-current={position === index ? 'true' : undefined}
          >
            <article className={styles.slideCard} data-cw-glass="standard">
              <div className={styles.slideMedia}>
                <Image
                  src={project.image.src}
                  alt={project.image.alt}
                  width={project.image.width}
                  height={project.image.height}
                  sizes="(min-width: 768px) 220px, 180px"
                  className={styles.slideImage}
                />
              </div>
              <div className={styles.slideBody}>
                <h3 className={styles.slideTitle}>{project.title}</h3>
                <p className={styles.slideSummary}>{project.summary}</p>
                <p className="cw-visually-hidden">{labels.technologies}</p>
                <ul className={styles.chips}>
                  {project.technologies.map((name) => (
                    <li key={name} className={styles.chip}>
                      {name}
                    </li>
                  ))}
                </ul>
                <Link href={project.href} className={buttonClassName({ variant: 'solid', className: styles.slideLink })}>
                  {labels.viewCase}
                  <span className="cw-visually-hidden">: {project.title}</span>
                </Link>
              </div>
            </article>
          </div>
        ))}
      </div>

      <div className={cx('cw-js-only', styles.controls)} data-cw-glass="strong">
        <button type="button" className={styles.control} aria-label={labels.prev} onClick={() => goTo(index - 1)} data-cw-prev="">
          <span aria-hidden="true">&lt;</span>
        </button>
        <span className={styles.counter} aria-hidden="true">
          {total > 0 ? `${index + 1} / ${total}` : ''}
        </span>
        <button type="button" className={styles.control} aria-label={labels.next} onClick={() => goTo(index + 1)} data-cw-next="">
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>

      <p className="cw-visually-hidden" aria-live="polite" aria-atomic="true" data-cw-carousel-status="">
        {announcement}
      </p>
    </div>
  )
}
