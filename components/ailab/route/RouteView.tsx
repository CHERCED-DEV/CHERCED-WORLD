'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import {
  EMPTY_PROGRESS,
  fill,
  finishRoute,
  formatClock,
  isRouteActive,
  markOf,
  remainingMs,
  setActive,
  setMark,
  setNote,
  setPill,
  startRoute,
  type RouteMark,
  type RouteProgress,
} from '@/lib/ailab/route/progress'
import type { RouteStationView } from '@/lib/ailab/route/view'
import type { Locale } from '@/lib/i18n/config'
import type { RouteControlLabels } from './labels'
import { MarkIcon } from './MarkIcon'
import { RouteClock } from './RouteClock'
import { updateRouteProgress, useHydrated, useRouteProgress, useRouteStorageOk } from './use-route-progress'
import styles from './RouteView.module.scss'

export type RouteContextValue = {
  lang: Locale
  progress: RouteProgress
  ready: boolean
  order: readonly string[]
  stations: readonly RouteStationView[]
  mark: (id: string, mark: RouteMark) => void
  note: (id: string, text: string) => void
  goTo: (id: string) => void
}

const RouteContext = createContext<RouteContextValue | null>(null)

export function useRoute(): RouteContextValue {
  const value = useContext(RouteContext)
  if (!value) throw new Error('useRoute fuera de RouteView')
  return value
}

export function stationAnchor(id: string): string {
  return `estacion-${id}`
}

function focusStation(id: string) {
  const card = document.getElementById(stationAnchor(id))
  if (!card) return
  const details = card.closest('details')
  if (details && !details.open) details.open = true
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  document.getElementById(`${stationAnchor(id)}-title`)?.focus({ preventScroll: true })
}

function focusLater(selector: string) {
  window.requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.focus())
}

type Props = {
  lang: Locale
  labels: RouteControlLabels
  stations: readonly RouteStationView[]
  order: readonly string[]
  actions?: ReactNode
  children: ReactNode
}

export function RouteView({ lang, labels, stations, order, actions, children }: Props) {
  const progress = useRouteProgress()
  const ready = useHydrated()
  const storageOk = useRouteStorageOk()
  const [announcement, setAnnouncement] = useState('')
  const byId = useMemo(() => new Map(stations.map((station) => [station.id, station])), [stations])

  useEffect(() => {
    updateRouteProgress((current) => setPill(current, true))
  }, [])

  const announce = useCallback((text: string) => {
    setAnnouncement((previous) => (previous === text ? `${text} ` : text))
  }, [])

  const timeText = useCallback(
    (current: RouteProgress) => {
      const left = remainingMs(current, Date.now())
      return left >= 0 ? fill(labels.timeLeft, { time: formatClock(left) }) : fill(labels.timeOver, { time: formatClock(-left) })
    },
    [labels.timeLeft, labels.timeOver],
  )

  const stationText = useCallback(
    (current: RouteProgress, id: string) => {
      const station = byId.get(id)
      const n = order.indexOf(id) + 1
      if (!station || n === 0) return ''
      return `${fill(labels.announceStation, { n, total: order.length, title: station.title })} ${timeText(current)}`
    },
    [byId, labels.announceStation, order, timeText],
  )

  const start = useCallback(() => {
    const next = updateRouteProgress((current) => startRoute(current, Date.now(), order))
    const first = next.active ?? order[0]
    if (!first) return
    announce(fill(labels.announceStart, { total: order.length, title: byId.get(first)?.title ?? '' }))
    focusStation(first)
  }, [announce, byId, labels.announceStart, order])

  const finish = useCallback(() => {
    updateRouteProgress((current) => finishRoute(current, Date.now()))
    focusLater('[data-cw-route-acta]')
  }, [])

  const reset = useCallback(() => {
    updateRouteProgress(() => EMPTY_PROGRESS)
    announce(labels.announceReset)
    focusLater('[data-cw-route-start]')
  }, [announce, labels.announceReset])

  const mark = useCallback(
    (id: string, value: RouteMark) => {
      let before: RouteProgress = EMPTY_PROGRESS
      const next = updateRouteProgress((current) => {
        before = current
        return setMark(current, id, value, order)
      })
      if (!isRouteActive(next) || next.active === before.active) return
      if (next.active) announce(stationText(next, next.active))
      else if (order.every((item) => next.marks[item])) announce(labels.announceComplete)
    },
    [announce, labels.announceComplete, order, stationText],
  )

  const note = useCallback((id: string, text: string) => {
    updateRouteProgress((current) => setNote(current, id, text))
  }, [])

  const goTo = useCallback((id: string) => focusStation(id), [])

  const onOver = useCallback(() => announce(labels.announceOver), [announce, labels.announceOver])

  const onOpen = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = (event.target as Element | null)?.closest?.('[data-cw-route-open]')
    const id = target?.getAttribute('data-cw-route-open')
    if (id) updateRouteProgress((current) => setActive(current, id))
  }, [])

  const value = useMemo<RouteContextValue>(
    () => ({ lang, progress, ready, order, stations, mark, note, goTo }),
    [goTo, lang, mark, note, order, progress, ready, stations],
  )

  const started = progress.startedAt !== null
  const active = isRouteActive(progress)

  return (
    <RouteContext.Provider value={value}>
      <div className={styles.view} data-cw-route-view="" data-ready={ready ? '' : undefined} onClick={onOpen}>
        <GlassSurface as="section" className={styles.controls} aria-label={labels.controls} data-cw-route-controls="" edge grain>
          <div className={styles.controlsTop}>
            <RouteClock progress={progress} labels={labels.clock} onOver={onOver} />
            <div className={styles.buttons}>
              {started ? null : (
                <Button variant="solid" onClick={start} disabled={!ready} data-cw-route-start="">
                  {labels.start}
                </Button>
              )}
              {active ? (
                <Button variant="glass" onClick={finish} data-cw-route-finish="">
                  {labels.finish}
                </Button>
              ) : null}
              {started ? (
                <Button variant="ghost" onClick={reset} data-cw-route-reset="">
                  {labels.reset}
                </Button>
              ) : null}
              {actions}
            </div>
          </div>
          {ready && !storageOk ? (
            <p className={styles.memory} data-cw-route-memory="">
              {labels.memory}
            </p>
          ) : null}
          <nav className={styles.rail} aria-label={labels.rail}>
            <ol>
              {order.map((id, index) => {
                const station = byId.get(id)
                if (!station) return null
                const state = markOf(progress, id)
                const current = active && progress.active === id
                return (
                  <li key={id}>
                    <a
                      href={`#${stationAnchor(id)}`}
                      className={styles.railLink}
                      aria-current={current ? 'step' : undefined}
                      data-mark={state}
                      data-cw-route-rail={id}
                      onClick={(event) => {
                        event.preventDefault()
                        focusStation(id)
                      }}
                    >
                      <span className={styles.railIndex} aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className={styles.railText}>
                        <span className={styles.railTitle}>
                          <span className="cw-visually-hidden">{fill(labels.count, { n: index + 1, total: order.length })}: </span>
                          {station.title}
                        </span>
                        <span className={styles.railState}>
                          <MarkIcon mark={state} className={styles.railIcon} />
                          {labels.marks[state]}
                          {current ? ` · ${labels.now}` : null}
                        </span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </nav>
          <p className="cw-visually-hidden" role="status" aria-live="polite" data-cw-route-announce="">
            {announcement}
          </p>
        </GlassSurface>
        {children}
      </div>
    </RouteContext.Provider>
  )
}
