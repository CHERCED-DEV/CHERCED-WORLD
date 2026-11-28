'use client'

import { useEffect, useId, useState } from 'react'
import { ProvidersConsent, useProvidersConsent } from '@/components/ai/providers/ProvidersConsent'
import { Button, buttonClassName } from '@/components/ui/Button'
import { REQUEST_MAX, REQUEST_MIN, type GateRun, type GateStep } from '@/lib/ai/gates/schema'
import type { Locale } from '@/lib/i18n/config'
import { gatesNumber, gatesText, type GatesCopyKey } from './copy'
import styles from './GatesStage.module.scss'
import { GATES_ENDPOINT, postGate, type GatesError } from './stream'

export type GatesStatus = { mode: 'live' | 'local' | 'off'; signedIn: boolean }

type Phase = 'idle' | 'consent' | 'running'

export type GatesLiveProps = {
  lang: Locale
  onStart: () => void
  onStep: (step: GateStep) => void
  onDone: (run: GateRun) => void
  onFail: (steps: GateStep[]) => void
}

export function GatesLive({ lang, onStart, onStep, onDone, onFail }: GatesLiveProps) {
  const text = gatesText(lang)
  const id = useId()
  const consented = useProvidersConsent()
  const [status, setStatus] = useState<GatesStatus | null>(null)
  const [request, setRequest] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<GatesError | null>(null)

  useEffect(() => {
    let alive = true
    fetch(GATES_ENDPOINT, { cache: 'no-store' })
      .then((response) => (response.ok ? (response.json() as Promise<GatesStatus>) : null))
      .then((value) => {
        if (alive && value) setStatus(value)
      })
      .catch(() => {
        if (alive) setStatus({ mode: 'off', signedIn: false })
      })
    return () => {
      alive = false
    }
  }, [])

  const trimmed = request.trim()
  const next = `/${lang}/ai-lab#lab-a12`
  const signInHref = `/${lang}/account?${new URLSearchParams({ next }).toString()}`

  const submit = async () => {
    if (trimmed.length < REQUEST_MIN) {
      setError('too_short')
      setPhase('idle')
      return
    }
    setPhase('running')
    setError(null)
    onStart()
    const result = await postGate(GATES_ENDPOINT, { lang, text: trimmed, consent: true }, onStep)
    setPhase('idle')
    if ('run' in result) onDone(result.run)
    else {
      setError(result.error)
      onFail(result.steps)
    }
  }

  const start = () => {
    if (!consented) {
      setPhase('consent')
      return
    }
    void submit()
  }

  return (
    <section className={styles.live} aria-labelledby={`${id}-title`} data-cw-gates-live={status?.mode ?? 'loading'}>
      <h5 id={`${id}-title`} className={styles.subtitle}>
        {text('gates.live.title')}
      </h5>
      <p className={styles.muted}>{text('gates.live.intro')}</p>
      {status?.mode === 'off' ? <p className={styles.note}>{text('gates.live.error.off')}</p> : null}
      {status?.mode === 'local' ? <p className={styles.note}>{text('gates.live.local')}</p> : null}
      {status && status.mode !== 'off' && !status.signedIn ? (
        <div className={styles.row}>
          <a href={signInHref} className={buttonClassName({ variant: 'solid', className: styles.signin })} data-cw-gates-signin="">
            {text('gates.live.signin')}
          </a>
          <p className={styles.muted}>{text('gates.live.signinHint')}</p>
        </div>
      ) : null}
      {status && status.mode !== 'off' && status.signedIn ? (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            start()
          }}
        >
          <label htmlFor={`${id}-request`} className={styles.label}>
            {text('gates.live.label', { max: REQUEST_MAX })}
          </label>
          <textarea
            id={`${id}-request`}
            className={styles.textarea}
            value={request}
            maxLength={REQUEST_MAX}
            rows={4}
            aria-describedby={`${id}-hint ${id}-count`}
            onChange={(event) => setRequest(event.target.value)}
            disabled={phase === 'running'}
            data-cw-gates-request=""
          />
          <p className={styles.hint}>
            <span id={`${id}-hint`}>{text('gates.live.hint')}</span>
            <span id={`${id}-count`}>{text('gates.live.count', { count: gatesNumber(request.length, lang), max: REQUEST_MAX })}</span>
          </p>
          {phase === 'consent' ? (
            <ProvidersConsent
              id={`${id}-consent`}
              labels={{
                title: text('gates.live.consent.title'),
                body: text('gates.live.consent.body'),
                more: text('gates.live.consent.more'),
                accept: text('gates.live.consent.accept'),
                cancel: text('gates.live.consent.cancel'),
              }}
              privacyHref={`/${lang}/privacy`}
              onAccept={() => void submit()}
              onCancel={() => setPhase('idle')}
            />
          ) : (
            <Button type="submit" variant="solid" disabled={phase === 'running' || !trimmed} data-cw-gates-run-live="">
              {text('gates.live.run')}
            </Button>
          )}
        </form>
      ) : null}
      <p className={styles.status} role="status" aria-live="polite">
        {phase === 'running' ? text('gates.live.running') : ''}
      </p>
      {error ? (
        <p className={styles.error} role="alert" data-cw-gates-error={error}>
          {text(`gates.live.error.${error}` as GatesCopyKey)}
        </p>
      ) : null}
    </section>
  )
}
