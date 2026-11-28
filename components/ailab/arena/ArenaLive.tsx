'use client'

import { useEffect, useId, useState } from 'react'
import { ProvidersConsent, useProvidersConsent } from '@/components/ai/providers/ProvidersConsent'
import { Button, buttonClassName } from '@/components/ui/Button'
import type { ArenaRun } from '@/content/ailab/arena/results'
import { ARENA_FREE_MAX, ARENA_FREE_MIN } from '@/content/ailab/arena/tasks'
import type { Locale } from '@/lib/i18n/config'
import styles from './ArenaStage.module.scss'
import { arenaNumber, arenaText, type ArenaCopyKey } from './copy'

export const ARENA_ENDPOINT = '/api/ailab/arena'

export const ARENA_LIVE_ERRORS = ['account', 'consent', 'rate_limited', 'daily_cap', 'budget', 'off', 'too_expensive', 'too_long', 'invalid', 'failed'] as const

export type ArenaLiveError = (typeof ARENA_LIVE_ERRORS)[number]

export type ArenaStatus = { mode: 'live' | 'local' | 'off'; signedIn: boolean }

export function liveErrorKey(value: unknown): ArenaLiveError {
  return typeof value === 'string' && (ARENA_LIVE_ERRORS as readonly string[]).includes(value) ? (value as ArenaLiveError) : 'failed'
}

type Phase = 'idle' | 'consent' | 'running'

export type ArenaLiveProps = { lang: Locale; taskId: string; onResult: (run: ArenaRun, free: string | null) => void }

export function ArenaLive({ lang, taskId, onResult }: ArenaLiveProps) {
  const text = arenaText(lang)
  const id = useId()
  const consented = useProvidersConsent()
  const [status, setStatus] = useState<ArenaStatus | null>(null)
  const [free, setFree] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<ArenaLiveError | null>(null)

  useEffect(() => {
    let alive = true
    fetch(ARENA_ENDPOINT, { cache: 'no-store' })
      .then((response) => (response.ok ? (response.json() as Promise<ArenaStatus>) : null))
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

  const trimmed = free.trim()
  const next = `/${lang}/ai-lab#lab-a10`
  const signInHref = `/${lang}/account?${new URLSearchParams({ next }).toString()}`

  const submit = async () => {
    if (trimmed && trimmed.length < ARENA_FREE_MIN) {
      setError('invalid')
      return
    }
    setPhase('running')
    setError(null)
    try {
      const response = await fetch(ARENA_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(trimmed ? { lang, free: trimmed, consent: true } : { lang, taskId, consent: true }),
      })
      const body = (await response.json().catch(() => null)) as { run?: ArenaRun; error?: unknown } | null
      if (!response.ok || !body?.run) {
        setError(liveErrorKey(body?.error))
        return
      }
      onResult(body.run, trimmed || null)
    } catch {
      setError('failed')
    } finally {
      setPhase('idle')
    }
  }

  const start = () => {
    if (!consented) {
      setPhase('consent')
      return
    }
    void submit()
  }

  const errorKey: ArenaCopyKey | null = error ? (`arena.live.error.${error}` as ArenaCopyKey) : null

  return (
    <section className={styles.live} aria-labelledby={`${id}-title`} data-cw-arena-live={status?.mode ?? 'loading'}>
      <h4 id={`${id}-title`} className={styles.columnTitle}>
        {text('arena.live.title')}
      </h4>
      <p className={styles.muted}>{text('arena.live.intro')}</p>
      {status?.mode === 'off' ? <p className={styles.note}>{text('arena.live.error.off')}</p> : null}
      {status && status.mode !== 'off' && !status.signedIn ? (
        <div className={styles.row}>
          <a href={signInHref} className={buttonClassName({ variant: 'solid' })} data-cw-arena-signin="">
            {text('arena.live.signin')}
          </a>
          <p className={styles.muted}>{text('arena.live.signinHint')}</p>
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
          <label htmlFor={`${id}-free`} className={styles.label}>
            {text('arena.live.free.label')}
          </label>
          <textarea
            id={`${id}-free`}
            className={styles.textarea}
            value={free}
            maxLength={ARENA_FREE_MAX}
            rows={3}
            aria-describedby={`${id}-hint ${id}-count`}
            onChange={(event) => setFree(event.target.value)}
            disabled={phase === 'running'}
            data-cw-arena-free=""
          />
          <p className={styles.hint}>
            <span id={`${id}-hint`}>{trimmed ? text('arena.live.freeNote') : `${text('arena.live.fixed')} · ${text('arena.live.free.hint')}`}</span>
            <span id={`${id}-count`}>{text('arena.live.free.count', { count: arenaNumber(free.length, lang) })}</span>
          </p>
          {phase === 'consent' ? (
            <ProvidersConsent
              id={`${id}-consent`}
              labels={{ title: text('arena.consent.title'), body: text('arena.consent.body'), more: text('arena.consent.more'), accept: text('arena.consent.accept'), cancel: text('arena.consent.cancel') }}
              privacyHref={`/${lang}/privacy`}
              onAccept={() => void submit()}
              onCancel={() => setPhase('idle')}
            />
          ) : (
            <Button type="submit" variant="solid" disabled={phase === 'running'} data-cw-arena-run-live="">
              {text('arena.live.run')}
            </Button>
          )}
        </form>
      ) : null}
      <p className={styles.status} role="status" aria-live="polite">
        {phase === 'running' ? text('arena.live.running') : ''}
      </p>
      {errorKey ? (
        <p className={styles.error} role="alert" data-cw-arena-error={error ?? ''}>
          {text(errorKey)}
        </p>
      ) : null}
    </section>
  )
}
