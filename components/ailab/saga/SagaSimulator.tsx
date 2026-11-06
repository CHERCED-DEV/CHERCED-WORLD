'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import {
  SAGA_FAILURES,
  SAGA_KIND,
  SAGA_STEPS,
  messageKey,
  messageVars,
  runSaga,
  snapshotAt,
  type SagaEvent,
  type SagaFailure,
} from '@/lib/ailab/saga/engine'
import styles from './SagaSimulator.module.scss'

export const SAGA_TICK_MS = 700

const MARK: Record<SagaEvent['type'], string> = {
  start: '▸',
  request: '→',
  done: '✓',
  fail: '✕',
  compensate: '↩',
  confirm: '✓',
  end: '■',
}

function failureId(failure: SagaFailure): string {
  return failure ?? 'none'
}

export function SagaSimulator({ t }: LabDemoProps) {
  const uid = useId()
  const [failAt, setFailAt] = useState<SagaFailure>('payment')
  const [cursor, setCursor] = useState(0)
  const [playing, setPlaying] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const run = useMemo(() => runSaga(failAt), [failAt])
  const total = run.events.length
  const finished = cursor >= total
  const running = cursor > 0 && !finished
  const auto = playing && !finished
  const state = snapshotAt(run, cursor)
  const shown = run.events.slice(0, cursor)

  useEffect(() => {
    if (!auto) return
    const timer = window.setTimeout(() => setCursor((value) => Math.min(value + 1, total)), SAGA_TICK_MS)
    return () => window.clearTimeout(timer)
  }, [auto, cursor, total])

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [cursor])

  const primary = () => {
    if (auto) {
      setPlaying(false)
      return
    }
    if (cursor === 0 || finished) setCursor(1)
    setPlaying(true)
  }

  const step = () => {
    if (finished) return
    setPlaying(false)
    setCursor((value) => Math.min(value + 1, total))
  }

  const reset = () => {
    if (cursor === 0) return
    setPlaying(false)
    setCursor(0)
  }

  const choose = (failure: SagaFailure) => {
    if (running) return
    setFailAt(failure)
    setPlaying(false)
    setCursor(0)
  }

  const primaryLabel = auto ? t('ailab.r1.pause') : running ? t('ailab.r1.resume') : finished ? t('ailab.r1.again') : t('ailab.r1.run')
  const logTitleId = `${uid}-log`
  const legendId = `${uid}-legend`

  return (
    <div className={styles.saga} data-cw-saga="" data-phase={state.phase} data-fail={failureId(failAt)}>
      <fieldset className={styles.fieldset} disabled={running} aria-describedby={running ? `${uid}-locked` : undefined}>
        <legend className={styles.legend}>{t('ailab.r1.fail.legend')}</legend>
        <div className={styles.options}>
          {SAGA_FAILURES.map((failure) => {
            const id = failureId(failure)
            return (
              <label key={id} className={styles.option}>
                <input
                  type="radio"
                  name={`${uid}-fail`}
                  value={id}
                  checked={failAt === failure}
                  onChange={() => choose(failure)}
                  data-cw-saga-fail={id}
                />
                <span>{t(`ailab.r1.fail.${id}`)}</span>
              </label>
            )
          })}
        </div>
        {running ? (
          <p id={`${uid}-locked`} className={styles.hint}>
            {t('ailab.r1.fail.locked')}
          </p>
        ) : null}
      </fieldset>

      <div className={styles.actions}>
        <Button variant="solid" onClick={primary} data-cw-saga-run="">
          {primaryLabel}
        </Button>
        <Button variant="glass" onClick={step} aria-disabled={finished || undefined} data-cw-saga-next="">
          {t('ailab.r1.next')}
        </Button>
        <Button variant="ghost" onClick={reset} aria-disabled={cursor === 0 || undefined} data-cw-saga-reset="">
          {t('ailab.r1.reset')}
        </Button>
        <span className={styles.progress} data-cw-saga-progress="">
          {t('ailab.r1.progress', { current: cursor, total })}
        </span>
      </div>

      <div className={styles.board}>
        <div className={styles.flow}>
          <ol className={styles.diagram} aria-label={t('ailab.r1.diagram')} aria-describedby={legendId} data-cw-saga-diagram="">
            {SAGA_STEPS.map((id, index) => {
              const status = state.steps[id]
              const doomed = failAt === id && status === 'pending'
              return (
                <li key={id} className={styles.node} data-cw-saga-step={id} data-status={status} data-kind={SAGA_KIND[id]}>
                  <span className={styles.nodeHead}>
                    <span className={styles.nodeIndex} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.nodeName}>{t(`ailab.r1.step.${id}`)}</span>
                  </span>
                  <span className={styles.nodeService}>{t(`ailab.r1.service.${id}`)}</span>
                  <span className={styles.nodeStatus} data-cw-saga-status="">
                    {t(`ailab.r1.status.${status}`)}
                  </span>
                  {doomed ? (
                    <span className={styles.doomed} data-cw-saga-doomed="">
                      {t('ailab.r1.doomed')}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ol>
          {state.phase === 'compensating' || state.phase === 'compensated' ? (
            <p className={styles.direction} data-cw-saga-direction="">
              <span aria-hidden="true">↩ </span>
              {t('ailab.r1.direction')}
            </p>
          ) : null}
          <dl id={legendId} className={styles.legendList}>
            <div className={styles.legendItem} data-kind="hold">
              <dt>{t('ailab.r1.legend.hold')}</dt>
              <dd>{t('ailab.r1.legend.hold.desc')}</dd>
            </div>
            <div className={styles.legendItem} data-kind="booking">
              <dt>{t('ailab.r1.legend.booking')}</dt>
              <dd>{t('ailab.r1.legend.booking.desc')}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.logBox}>
          <p id={logTitleId} className={styles.logTitle}>
            {t('ailab.r1.logTitle')}
          </p>
          <div
            ref={logRef}
            className={styles.log}
            role="log"
            aria-live="polite"
            aria-labelledby={logTitleId}
            tabIndex={0}
            data-cw-saga-log=""
          >
            {shown.length === 0 ? (
              <p className={styles.logEmpty}>{t('ailab.r1.logEmpty')}</p>
            ) : (
              <ol className={styles.entries}>
                {shown.map((event, index) => (
                  <li key={index} className={styles.entry} data-cw-saga-entry={event.type} data-key={messageKey(event)}>
                    <span className={styles.mark} aria-hidden="true">
                      {MARK[event.type]}
                    </span>
                    <span>{t(`ailab.r1.log.${messageKey(event)}`, messageVars(event))}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>

      {finished ? (
        <p className={styles.outcome} data-cw-saga-outcome={run.outcome}>
          {run.outcome === 'completed'
            ? t('ailab.r1.outcome.completed')
            : t('ailab.r1.outcome.compensated', { released: state.released, cancelled: state.cancelled })}
        </p>
      ) : null}
    </div>
  )
}

export default SagaSimulator
