'use client'

import { useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { tap } from '@/lib/fx/haptics'
import { useSwipe } from '@/lib/fx/swipe'
import type { Locale } from '@/lib/i18n'
import styles from './About.module.scss'
import type { DeckJob } from './CareerDeck'
import { cycleHand, handOrder, handPose } from './deck'
import { typeset } from '../typeset'
import { JobSummary } from './JobSummary'
import { Period } from './Period'

export type CareerHandLabels = { present: string; open: string; close: string; prev: string; next: string }

export type CareerHandProps = { lang: Locale; jobs: DeckJob[]; labels: CareerHandLabels }

export function CareerHand({ lang, jobs, labels }: CareerHandProps) {
  const [order, setOrder] = useState(() => handOrder(jobs.length))
  const [open, setOpen] = useState(false)
  const [drag, setDrag] = useState(0)
  const topRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const textId = useId()
  const counterId = useId()
  const top = order[0] ?? 0
  const job = jobs[top]
  const many = jobs.length > 1

  const step = (direction: 'prev' | 'next') => {
    setDrag(0)
    setOrder((current) => cycleHand(current, direction))
  }

  useSwipe(topRef, {
    enabled: many && !open,
    onMove: (dx) => setDrag(dx),
    onEnd: () => setDrag(0),
    onPrev: () => step('prev'),
    onNext: () => step('next'),
  })

  if (!job) return null

  const counter = `${top + 1} / ${jobs.length}`

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!many) return
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    step(event.key === 'ArrowRight' ? 'next' : 'prev')
  }

  return (
    <div className={styles.hand} data-cw-hand="">
      <div className={styles.handStack} data-dragging={drag !== 0 ? '' : undefined}>
        <ul className={styles.handCards} aria-hidden="true">
          {jobs.map((item, index) => {
            const pose = handPose(index, order)
            const isTop = pose.depth === 0
            const style = {
              '--cw-hand-lift': `${pose.lift}px`,
              '--cw-hand-scale': pose.scale,
              '--cw-hand-tilt': `${pose.tilt}deg`,
              '--cw-hand-z': jobs.length - pose.depth,
              ...(isTop && drag !== 0 ? { '--cw-hand-drag': `${drag}px`, '--cw-hand-drag-tilt': `${(drag / 24).toFixed(2)}deg` } : {}),
            } as CSSProperties
            return (
              <li
                key={item.id}
                className={styles.handCard}
                style={style}
                data-cw-hand-card={item.id}
                data-depth={pose.depth}
                data-shown={pose.shown ? '' : undefined}
                data-top={isTop ? '' : undefined}
                data-current={item.end === null ? '' : undefined}
                data-cw-glass="standard"
              >
                <span className={styles.deckPeriod}>
                  <Period start={item.start} end={item.end} lang={lang} presentLabel={labels.present} />
                </span>
                <span className={styles.deckRole}>{typeset(item.role, lang)}</span>
                <span className={styles.deckCompany}>{item.company}</span>
                <span className={styles.deckHint}>
                  {labels.open}
                  <span className={styles.deckPlus}>+</span>
                </span>
              </li>
            )
          })}
        </ul>
        <button
          ref={topRef}
          type="button"
          className={styles.handTop}
          aria-haspopup="dialog"
          aria-label={`${job.role} · ${job.company}`}
          aria-describedby={counterId}
          data-cw-hand-top={job.id}
          onClick={() => {
            tap()
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {many ? (
        <div className={styles.handNav} data-cw-hand-nav="">
          <button type="button" className={styles.handButton} onClick={() => step('prev')} data-cw-hand-prev="">
            <Icon name="back" size={18} />
            <span>{labels.prev}</span>
          </button>
          <p id={counterId} className={styles.handCounter} aria-live="polite" data-cw-hand-counter="">
            {counter}
          </p>
          <button type="button" className={styles.handButton} onClick={() => step('next')} data-cw-hand-next="">
            <span>{labels.next}</span>
            <Icon name="back" size={18} className={styles.handFlip} />
          </button>
        </div>
      ) : null}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        describedBy={textId}
        closeLabel={labels.close}
        onSwipe={many ? step : undefined}
        navLabels={many ? { prev: labels.prev, next: labels.next } : undefined}
        counter={many ? counter : undefined}
      >
        <div className={cx(styles.deckOpen, styles.handOpen)} data-cw-hand-open={job.id}>
          <p className={styles.deckOpenPeriod}>
            <span className={cx(styles.whenChip, job.end === null && styles.whenChipCurrent)}>
              <Period start={job.start} end={job.end} lang={lang} presentLabel={labels.present} />
            </span>
          </p>
          <h2 id={titleId} className={styles.deckOpenRole}>
            {typeset(job.role, lang)}
          </h2>
          <p className={styles.jobCompany}>{job.company}</p>
          <JobSummary id={textId} lang={lang} description={job.description} highlights={job.highlights} />
        </div>
      </BottomSheet>
    </div>
  )
}
