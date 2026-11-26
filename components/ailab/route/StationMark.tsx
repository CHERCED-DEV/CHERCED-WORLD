'use client'

import { useId } from 'react'
import { fill, isRouteActive, markOf, nextStation, ROUTE_MARKS, ROUTE_NOTE_MAX } from '@/lib/ailab/route/progress'
import type { RouteMarkLabels } from './labels'
import { MarkIcon } from './MarkIcon'
import { stationAnchor, useRoute } from './RouteView'
import styles from './StationCard.module.scss'

export function StationMark({ id, labels }: { id: string; labels: RouteMarkLabels }) {
  const route = useRoute()
  const noteId = useId()
  const hintId = useId()
  const mark = markOf(route.progress, id)
  const note = route.progress.notes[id] ?? ''
  const core = route.order.includes(id)
  const nextId = core && mark !== 'untested' ? nextStation(route.order, route.progress.marks, id) : null
  const next = nextId ? route.stations.find((station) => station.id === nextId) : undefined
  const current = isRouteActive(route.progress) && route.progress.active === id

  return (
    <div className={styles.mark} data-cw-route-mark={id} data-mark={mark} data-current={current ? '' : undefined}>
      <fieldset className={styles.markSet} disabled={!route.ready}>
        <legend className={styles.label}>{labels.legend}</legend>
        <div className={styles.options}>
          {ROUTE_MARKS.map((value) => (
            <label key={value} className={styles.option} data-value={value}>
              <input
                type="radio"
                name={`route-mark-${id}`}
                value={value}
                checked={mark === value}
                onChange={() => route.mark(id, value)}
                data-cw-route-mark-option={value}
              />
              <MarkIcon mark={value} className={styles.optionIcon} />
              <span>{labels[value]}</span>
            </label>
          ))}
        </div>
        <label htmlFor={noteId} className={styles.label}>
          {labels.notes}
        </label>
        <textarea
          id={noteId}
          className={styles.notes}
          rows={3}
          maxLength={ROUTE_NOTE_MAX}
          value={note}
          aria-describedby={hintId}
          onChange={(event) => route.note(id, event.target.value)}
          data-cw-route-note={id}
        />
        <p id={hintId} className={styles.hint}>
          {fill(labels.hint, { count: note.length, max: ROUTE_NOTE_MAX })}
        </p>
      </fieldset>
      {next ? (
        <a
          href={`#${stationAnchor(next.id)}`}
          className={styles.next}
          onClick={(event) => {
            event.preventDefault()
            route.goTo(next.id)
          }}
          data-cw-route-next={next.id}
        >
          {labels.next}: {next.title} →
        </a>
      ) : null}
    </div>
  )
}
