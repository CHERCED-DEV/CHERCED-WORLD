'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useId, useMemo, useRef, useState, ViewTransition, type CSSProperties, type KeyboardEvent } from 'react'
import type { ProjectEra } from '@/content/types'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import {
  chipsFor,
  eraUsage,
  fillTemplate,
  filterProjects,
  filtersSummary,
  indexForKey,
  nearestIndex,
  slideStep,
  technologyUsage,
  wrapIndex,
  type SlideProject,
} from './carousel'
import type { EraLabels } from './labels'
import styles from './Portfolio.module.scss'
import { isPlainClick, markSharedNavigation, projectMediaName } from './transition'
import { useRailOverflow } from './useRailOverflow'

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
  era: string
  eras: EraLabels
  filteredEra: string
  clearFilters: string
}

export type ProjectsExplorerProps = {
  projects: SlideProject[]
  technologies: string[]
  labels: ExplorerLabels
}

const SETTLE_MS = 120
const HEADING_MS = 1500
const VISIBLE_CHIPS = 4

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
}

export function ProjectsExplorer({ projects, technologies, labels }: ProjectsExplorerProps) {
  const currentTemplate = labels.current
  const [tech, setTech] = useState<string | null>(null)
  const [era, setEra] = useState<ProjectEra | null>(null)
  const [index, setIndex] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const trackRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLUListElement>(null)
  const indexRef = useRef(0)
  const settleRef = useRef<number | undefined>(undefined)
  const headingRef = useRef<{ target: number; until: number } | null>(null)
  const uid = useId().replace(/:/g, '')
  const hintId = `${uid}-hint`
  const filterId = `${uid}-filter`
  const eraId = `${uid}-era`
  const overflow = useRailOverflow(railRef)

  const usage = useMemo(() => technologyUsage(projects, technologies), [projects, technologies])
  const eras = useMemo(() => eraUsage(projects), [projects])
  const visible = useMemo(() => filterProjects(projects, { tech, era }), [projects, tech, era])
  const total = visible.length
  const summary = (count: number, nextTech: string | null, nextEra: ProjectEra | null) =>
    filtersSummary(labels, count, nextTech, nextEra ? labels.eras[nextEra] : null)

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
      if (!track || !slide) return
      headingRef.current = { target: next, until: performance.now() + HEADING_MS }
      track.scrollTo({ left: slide.offsetLeft, behavior: scrollBehavior() })
    },
    [select, total],
  )

  useEffect(() => {
    indexRef.current = 0
    trackRef.current?.scrollTo({ left: 0 })
  }, [tech, era])

  useEffect(() => () => window.clearTimeout(settleRef.current), [])

  const onScroll = () => {
    window.clearTimeout(settleRef.current)
    settleRef.current = window.setTimeout(() => {
      const track = trackRef.current
      if (!track) return
      const slides = track.children
      const step = slideStep((slides[0] as HTMLElement | undefined)?.offsetLeft, (slides[1] as HTMLElement | undefined)?.offsetLeft, track.clientWidth)
      const next = nearestIndex(track.scrollLeft, step, total)
      const heading = headingRef.current
      if (heading) {
        if (next !== heading.target && performance.now() < heading.until) return
        headingRef.current = null
      }
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
    const count = filterProjects(projects, { tech: value, era }).length
    setTech(value)
    setIndex(0)
    setAnnouncement(summary(count, value, era))
  }

  const chooseEra = (value: ProjectEra) => {
    const next = value === era ? null : value
    const count = filterProjects(projects, { tech, era: next }).length
    setEra(next)
    setIndex(0)
    setAnnouncement(summary(count, tech, next))
  }

  const clearFilters = () => {
    setTech(null)
    setEra(null)
    setIndex(0)
    setAnnouncement(summary(projects.length, null, null))
    trackRef.current?.focus({ preventScroll: true })
  }

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current
    if (!rail) return
    rail.scrollBy({ left: direction * rail.clientWidth * 0.7, behavior: scrollBehavior() })
  }

  return (
    <div className={styles.explorer} data-cw-projects="">
      <div className={styles.filters} data-cw-filters="">
      <div className={cx('cw-js-only', styles.filter, styles.eraFilter)} role="group" aria-labelledby={eraId} data-cw-era-group="">
        <p id={eraId} className={styles.filterLabel}>
          {labels.era}
        </p>
        <div className={styles.eraBar}>
          {eras.map((item) => (
            <button
              key={item.era}
              type="button"
              className={styles.chipButton}
              aria-pressed={era === item.era}
              onClick={() => chooseEra(item.era)}
              data-cw-era-filter={item.era}
            >
              {labels.eras[item.era]}
              <span className={styles.chipCount} aria-hidden="true">
                {item.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={cx('cw-js-only', styles.filter)} role="group" aria-labelledby={filterId}>
        <p id={filterId} className={styles.filterLabel}>
          {labels.filter}
        </p>
        <div className={styles.filterBar}>
          <button
            type="button"
            className={cx(styles.chipButton, styles.chipAll)}
            aria-pressed={tech === null}
            onClick={() => chooseTech(null)}
            data-cw-filter=""
          >
            {labels.filterAll}
            <span className={styles.chipCount} aria-hidden="true">
              {projects.length}
            </span>
          </button>
          <span className={styles.filterDivider} aria-hidden="true" />
          <div className={styles.rail} data-start={overflow.start ? '' : undefined} data-end={overflow.end ? '' : undefined}>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className={styles.railArrow}
              data-dir="prev"
              hidden={!overflow.start}
              onClick={() => scrollRail(-1)}
              data-cw-filter-scroll="prev"
            >
              <span>‹</span>
            </button>
            <ul ref={railRef} className={styles.filterList}>
              {usage.map((item) => (
                <li key={item.name}>
                  <button
                    type="button"
                    className={styles.chipButton}
                    aria-pressed={tech === item.name}
                    onClick={() => chooseTech(item.name)}
                    data-cw-filter={item.name}
                  >
                    {item.name}
                    <span className={styles.chipCount} aria-hidden="true">
                      {item.count}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              className={styles.railArrow}
              data-dir="next"
              hidden={!overflow.end}
              onClick={() => scrollRail(1)}
              data-cw-filter-scroll="next"
            >
              <span>›</span>
            </button>
          </div>
        </div>
      </div>
      </div>
      <p className={cx('cw-js-only', styles.filterCount)} data-cw-filter-count="">
        {summary(total, tech, era)}
      </p>

      <p id={hintId} className="cw-visually-hidden">
        {labels.carouselHint}
      </p>
      {total === 0 ? (
        <div className={styles.empty} data-cw-glass="standard" data-cw-projects-empty="">
          <p className={styles.emptyText}>{summary(0, tech, era)}</p>
          <button type="button" className={buttonClassName({ variant: 'solid' })} onClick={clearFilters} data-cw-clear-filters="">
            {labels.clearFilters}
          </button>
        </div>
      ) : null}
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
        {visible.map((project, position) => {
          const chips = chipsFor(project.technologies, tech, VISIBLE_CHIPS)
          const ratio = project.image.width / project.image.height
          return (
            <div
              key={project.id}
              role="group"
              aria-roledescription="slide"
              aria-label={fillTemplate(labels.slide, { n: position + 1, total })}
              className={styles.slide}
              data-cw-slide={project.id}
              data-current={position === index ? 'true' : undefined}
            >
              <article
                className={styles.slideCard}
                data-cw-glass="standard"
                data-cw-light=""
                data-cw-blur={position === index ? '' : undefined}
                data-orientation={ratio >= 1 ? 'landscape' : 'portrait'}
                style={{ '--cw-media-ratio': ratio.toFixed(4) } as CSSProperties}
              >
                <div className={styles.slideMedia} data-cw-slide-media="">
                  <ViewTransition name={position === index ? projectMediaName(project.id) : undefined} share="auto" default="none">
                    <Image
                      src={project.image.src}
                      alt={project.image.alt}
                      width={project.image.width}
                      height={project.image.height}
                      sizes={ratio >= 1 ? '(min-width: 768px) 560px, 92vw' : '(min-width: 768px) 220px, 180px'}
                      className={styles.slideImage}
                    />
                  </ViewTransition>
                </div>
                <div className={styles.slideBody}>
                  <div className={styles.slideMeta}>
                    <p className={styles.slideIndex} aria-hidden="true">
                      {String(project.order).padStart(2, '0')}
                    </p>
                    <p className={styles.slideEra} data-cw-era={project.era}>
                      <span className="cw-visually-hidden">{labels.era}: </span>
                      {labels.eras[project.era]}
                    </p>
                  </div>
                  <h3 className={styles.slideTitle}>{project.title}</h3>
                  <p className={styles.slideSummary}>{project.summary}</p>
                  <p className="cw-visually-hidden">{labels.technologies}</p>
                  <ul className={styles.chips}>
                    {chips.shown.map((name) => (
                      <li key={name} className={styles.chip} data-active={name === tech ? '' : undefined}>
                        {name}
                      </li>
                    ))}
                    {chips.rest.map((name) => (
                      <li key={name} className="cw-visually-hidden">
                        {name}
                      </li>
                    ))}
                    {chips.rest.length > 0 ? (
                      <li className={cx(styles.chip, styles.chipMore)} aria-hidden="true">
                        +{chips.rest.length}
                      </li>
                    ) : null}
                  </ul>
                  <Link
                    href={project.href}
                    className={buttonClassName({ variant: 'solid', className: styles.slideLink })}
                    onClick={(event) => {
                      if (position === index && isPlainClick(event)) markSharedNavigation(projectMediaName(project.id))
                    }}
                  >
                    {labels.viewCase}
                    <span className="cw-visually-hidden">: {project.title}</span>
                  </Link>
                </div>
              </article>
            </div>
          )
        })}
      </div>

      <div className={cx('cw-js-only', styles.controls)} data-cw-glass="strong">
        <button type="button" className={styles.control} aria-label={labels.prev} onClick={() => goTo(index - 1)} data-cw-prev="">
          <span aria-hidden="true">&lt;</span>
        </button>
        <span className={styles.position}>
          <span className={styles.counter} aria-hidden="true">
            {total > 0 ? `${index + 1} / ${total}` : ''}
          </span>
          {total > 1 ? (
            <ol className={styles.dots} aria-hidden="true" data-cw-carousel-dots="">
              {visible.map((project, position) => (
                <li key={project.id} className={styles.dot} data-current={position === index ? '' : undefined} />
              ))}
            </ol>
          ) : null}
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
