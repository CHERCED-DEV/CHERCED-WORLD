'use client'

import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { Dialog } from '@/components/ui/Dialog'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n'
import styles from './About.module.scss'
import { deckSlot, flightFrom, flightTransform } from './deck'
import { typeset } from '../typeset'
import { JobSummary } from './JobSummary'
import { Period } from './Period'

export type DeckJob = {
  id: string
  role: string
  company: string
  description: string
  highlights: string[]
  start: string
  end: string | null
}

export type CareerDeckProps = {
  lang: Locale
  jobs: DeckJob[]
  labels: { present: string; open: string; close: string }
}

const FLIGHT_MS = 520
const FADE_MS = 160
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function geometry(source: HTMLElement, dialog: HTMLElement) {
  const rect = source.getBoundingClientRect()
  return flightFrom(
    {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      offsetWidth: source.offsetWidth,
      offsetHeight: source.offsetHeight,
      rotate: Number(source.dataset.rotate ?? 0),
    },
    dialog.getBoundingClientRect(),
  )
}

function fly(dialog: HTMLElement, source: HTMLElement, content: HTMLElement | null, direction: 'open' | 'close'): Animation[] {
  if (prefersReducedMotion() || typeof dialog.animate !== 'function') {
    const fade = [{ opacity: 0 }, { opacity: 1 }]
    return [dialog.animate(direction === 'open' ? fade : [...fade].reverse(), { duration: FADE_MS, easing: 'linear', fill: 'both' })]
  }
  const card = flightTransform(geometry(source, dialog))
  const frames = [
    { transform: card, opacity: 0.85 },
    { transform: 'none', opacity: 1 },
  ]
  const animations = [dialog.animate(direction === 'open' ? frames : [...frames].reverse(), { duration: FLIGHT_MS, easing: EASE, fill: 'both' })]
  if (content) {
    const reveal = [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: 0.45 },
      { opacity: 1, offset: 1 },
    ]
    animations.push(
      content.animate(direction === 'open' ? reveal : [{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 0 }], {
        duration: FLIGHT_MS,
        easing: 'linear',
        fill: 'both',
      }),
    )
  }
  return animations
}

export function CareerDeck({ lang, jobs, labels }: CareerDeckProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const sources = useRef<Array<HTMLButtonElement | null>>([])
  const contentRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const closing = useRef(false)
  const flights = useRef<Animation[]>([])
  const restore = useRef<HTMLButtonElement | null>(null)
  const job = openIndex === null ? null : (jobs[openIndex] ?? null)

  const measureMore = () => {
    const body = bodyRef.current
    setMore(body !== null && body.scrollHeight - body.scrollTop - body.clientHeight > 4)
  }

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return
    measureMore()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measureMore)
    observer.observe(body)
    return () => observer.disconnect()
  }, [job])

  const stopFlights = () => {
    for (const animation of flights.current) animation.cancel()
    flights.current = []
  }

  const settle = (index: number | null) => {
    stopFlights()
    closing.current = false
    const source = index === null ? null : (sources.current[index] ?? null)
    source?.removeAttribute('data-flying')
    contentRef.current?.closest('dialog')?.removeAttribute('data-closing')
    restore.current = source
    setOpenIndex(null)
  }

  const close = () => {
    if (openIndex === null || closing.current) return
    const index = openIndex
    const dialog = contentRef.current?.closest('dialog')
    const source = sources.current[index]
    if (!dialog || !source) {
      settle(index)
      return
    }
    closing.current = true
    dialog.setAttribute('data-closing', '')
    stopFlights()
    flights.current = fly(dialog, source, contentRef.current, 'close')
    const [main] = flights.current
    if (!main) {
      settle(index)
      return
    }
    main.finished.then(
      () => settle(index),
      () => undefined,
    )
  }

  const startFlight = useEffectEvent((index: number) => {
    const dialog = contentRef.current?.closest('dialog')
    const source = sources.current[index]
    if (!dialog || !source) return
    source.setAttribute('data-flying', '')
    flights.current = fly(dialog, source, contentRef.current, 'open')
  })

  const requestClose = useEffectEvent(() => close())

  useEffect(() => {
    if (openIndex === null) {
      const target = restore.current
      restore.current = null
      if (target && document.activeElement !== target) target.focus({ preventScroll: true })
      return
    }
    startFlight(openIndex)
    const dialog = contentRef.current?.closest('dialog')
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      requestClose()
    }
    const onBackdrop = (event: MouseEvent) => {
      if (event.target !== dialog) return
      event.stopImmediatePropagation()
      event.preventDefault()
      requestClose()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('click', onBackdrop, true)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('click', onBackdrop, true)
    }
  }, [openIndex])

  return (
    <div className={styles.deck} data-cw-deck="">
      <ul className={styles.deckTable}>
        {jobs.map((item, index) => {
          const slot = deckSlot(index)
          return (
            <li
              key={item.id}
              className={styles.deckSlot}
              style={{ '--cw-x': slot.x, '--cw-y': slot.y, '--cw-r': `${slot.rotate}deg`, '--cw-z': index + 1 } as CSSProperties}
            >
              <button
                ref={(node) => {
                  sources.current[index] = node
                }}
                type="button"
                className={styles.deckCard}
                aria-haspopup="dialog"
                data-cw-deck-card={item.id}
                data-current={item.end === null ? '' : undefined}
                data-rotate={slot.rotate}
                data-cw-glass="standard"
                data-cw-light=""
                onClick={() => setOpenIndex(index)}
              >
                <span className={styles.deckPeriod}>
                  <Period start={item.start} end={item.end} lang={lang} presentLabel={labels.present} />
                </span>
                <span className={styles.deckRole}>{typeset(item.role, lang)}</span>
                <span className={styles.deckCompany}>{item.company}</span>
                <span className={styles.deckHint} aria-hidden="true">
                  {labels.open}
                  <span className={styles.deckPlus}>+</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <Dialog
        open={job !== null}
        onClose={() => {
          const dialog = contentRef.current?.closest('dialog')
          if (openIndex !== null && dialog && !dialog.open) settle(openIndex)
        }}
        labelledBy="career-dialog-title"
        describedBy="career-dialog-text"
        className={styles.deckDialog}
      >
        <div ref={contentRef} className={styles.deckOpen} data-cw-deck-open={job?.id}>
          {job ? (
            <>
              <div ref={bodyRef} className={styles.deckOpenBody} onScroll={measureMore} data-cw-more={more ? '' : undefined}>
                <p className={styles.deckOpenPeriod}>
                  <span className={cx(styles.whenChip, job.end === null && styles.whenChipCurrent)} data-cw-glass="strong">
                    <Period start={job.start} end={job.end} lang={lang} presentLabel={labels.present} />
                  </span>
                </p>
                <h3 id="career-dialog-title" className={styles.deckOpenRole}>
                  {typeset(job.role, lang)}
                </h3>
                <p className={styles.jobCompany}>{job.company}</p>
                <JobSummary id="career-dialog-text" lang={lang} description={job.description} highlights={job.highlights} />
              </div>
              <button
                type="button"
                className={buttonClassName({ variant: 'glass', size: 'sm', className: styles.deckClose })}
                onClick={close}
                data-cw-deck-close=""
              >
                <Icon name="close" size={18} />
                {labels.close}
              </button>
            </>
          ) : null}
        </div>
      </Dialog>
    </div>
  )
}
