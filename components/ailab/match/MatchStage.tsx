'use client'

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/Button'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { matchCopy, type MatchCopy } from '@/content/ailab/match'
import { USD_TO_COP } from '@/lib/ai/pricing'
import {
  isMatchResult,
  MATCH_ENDPOINT,
  MATCH_MODEL,
  VACANCY_MAX,
  VACANCY_MIN,
  type MatchError,
  type MatchMode,
  type MatchResult,
} from '@/lib/ai/match/config'
import type { Locale } from '@/lib/i18n/config'
import styles from './Match.module.scss'

type Phase = 'checking' | 'ready' | 'loading' | 'done'

const PRINT_ATTR = 'data-cw-print'

const LEVEL_MARK = { fuerte: '●', parcial: '◐', sin_evidencia: '○' } as const

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

function errorOf(value: unknown): Exclude<MatchError, 'forbidden'> {
  const error = value && typeof value === 'object' ? (value as { error?: unknown }).error : undefined
  if (error === 'off' || error === 'invalid' || error === 'too_long' || error === 'rate_limited' || error === 'daily_cap' || error === 'unavailable') return error
  return 'failed'
}

function money(lang: Locale, usd: number): { usd: string; cop: string } {
  const locale = lang === 'es' ? 'es-CO' : 'en-US'
  return {
    usd: `${new Intl.NumberFormat(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(usd)} USD`,
    cop: `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(usd * USD_TO_COP)} COP`,
  }
}

export function contactHref(lang: Locale, role: string): string {
  const query = role ? `?vacante=${encodeURIComponent(role)}` : ''
  return `/${lang}/contactMe${query}#contact-form`
}

function Report({ result, copy, lang, printable = false }: { result: MatchResult; copy: MatchCopy; lang: Locale; printable?: boolean }) {
  const cost = money(lang, result.costUsd)
  const role = result.role || copy.stageLabel
  return (
    <>
      <p className={styles.heading}>{fill(copy.heading, { role })}</p>
      <p className={styles.coverage} data-cw-match-coverage="">
        {fill(copy.coverage, result.coverage)}
      </p>
      <table className={styles.table} data-cw-match-table="">
        <caption className={styles.caption}>{copy.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{copy.columns.requirement}</th>
            <th scope="col">{copy.columns.kind}</th>
            <th scope="col">{copy.columns.level}</th>
            <th scope="col">{copy.columns.evidence}</th>
          </tr>
        </thead>
        <tbody>
          {result.requirements.map((item, index) => (
            <tr key={index} data-level={item.level} data-cw-match-row="">
              <th scope="row" className={styles.requirement}>
                <span>{item.text}</span>
                {item.note ? <span className={styles.note}>{item.note}</span> : null}
              </th>
              <td data-label={copy.columns.kind}>{copy.kinds[item.kind]}</td>
              <td data-label={copy.columns.level}>
                <span className={styles.level} data-level={item.level}>
                  <span aria-hidden="true">{LEVEL_MARK[item.level]}</span> {copy.levels[item.level]}
                </span>
              </td>
              <td data-label={copy.columns.evidence}>
                {item.evidence.length ? (
                  <ul className={styles.evidence}>
                    {item.evidence.map((entry) => (
                      <li key={entry.id}>
                        <a href={entry.url} data-cw-match-evidence={entry.id}>
                          {entry.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className={styles.muted}>{copy.noEvidence}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {result.questions.length ? (
        <div className={styles.questions}>
          <p className={styles.subheading}>{copy.questions}</p>
          <ol>
            {result.questions.map((question, index) => (
              <li key={index}>{question}</li>
            ))}
          </ol>
        </div>
      ) : null}
      <p className={styles.disclaimer} data-cw-match-disclaimer="">
        {copy.disclaimer}
      </p>
      {!printable ? (
        <p className={styles.muted} data-cw-match-meta="">
          {result.dropped > 0 ? `${fill(copy.dropped, { count: result.dropped })} ` : ''}
          {result.mode === 'live' ? fill(copy.cost, { ...cost, model: MATCH_MODEL }) : copy.simulator}
        </p>
      ) : null}
    </>
  )
}

export default function MatchStage({ lang }: LabDemoProps) {
  const copy = matchCopy[lang]
  const inputId = useId()
  const hintId = useId()
  const [mode, setMode] = useState<MatchMode | null>(null)
  const [phase, setPhase] = useState<Phase>('checking')
  const [vacancy, setVacancy] = useState('')
  const [result, setResult] = useState<MatchResult | null>(null)
  const [error, setError] = useState<Exclude<MatchError, 'forbidden'> | null>(null)
  const [printing, setPrinting] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let alive = true
    fetch(MATCH_ENDPOINT, { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { mode?: unknown }) => {
        if (!alive) return
        setMode(data.mode === 'live' || data.mode === 'local' ? data.mode : 'off')
        setPhase('ready')
      })
      .catch(() => {
        if (!alive) return
        setMode('off')
        setPhase('ready')
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!printing) return
    const root = document.documentElement
    root.setAttribute(PRINT_ATTR, 'match')
    const done = () => {
      root.removeAttribute(PRINT_ATTR)
      setPrinting(false)
    }
    window.addEventListener('afterprint', done, { once: true })
    const frame = requestAnimationFrame(() => window.print())
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('afterprint', done)
      root.removeAttribute(PRINT_ATTR)
    }
  }, [printing])

  const length = vacancy.trim().length
  const off = mode === 'off'
  const busy = phase === 'loading'
  const canSend = !off && !busy && phase !== 'checking' && length >= VACANCY_MIN && length <= VACANCY_MAX

  const analyze = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSend) {
      if (length < VACANCY_MIN) setError('invalid')
      return
    }
    setPhase('loading')
    setError(null)
    setResult(null)
    let data: unknown
    try {
      const response = await fetch(MATCH_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lang, vacancy }),
      })
      data = await response.json()
    } catch {
      data = { error: 'failed' }
    }
    if (isMatchResult(data)) {
      setResult(data)
      setPhase('done')
      requestAnimationFrame(() => resultRef.current?.focus())
    } else {
      setError(errorOf(data))
      setPhase('ready')
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setPhase('ready')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const date = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const origin = typeof window === 'undefined' ? '' : window.location.host
  const errorText = error ? fill(copy.errors[error], { min: VACANCY_MIN, max: VACANCY_MAX }) : null

  return (
    <section className={styles.stage} aria-label={copy.stageLabel} data-mode={mode ?? 'checking'} data-cw-match-stage="">
      <form className={styles.form} onSubmit={analyze} data-cw-match-form="">
        <label className={styles.label} htmlFor={inputId}>
          {copy.label}
        </label>
        <textarea
          ref={inputRef}
          id={inputId}
          className={styles.input}
          value={vacancy}
          onChange={(event) => setVacancy(event.target.value)}
          placeholder={copy.placeholder}
          maxLength={VACANCY_MAX}
          rows={9}
          disabled={off || busy}
          aria-describedby={hintId}
          data-cw-match-input=""
        />
        <p className={styles.hint} id={hintId}>
          <span>{fill(copy.counter, { count: vacancy.length, max: VACANCY_MAX, min: VACANCY_MIN })}</span>
          <span>{phase === 'checking' ? copy.checking : mode === 'local' ? copy.sentToLocal : off ? copy.errors.off : copy.sentTo}</span>
        </p>
        <div className={styles.row}>
          <Button type="submit" variant="solid" disabled={!canSend} aria-busy={busy} data-cw-match-submit="">
            {busy ? copy.analyzing : copy.analyze}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setVacancy(copy.sampleVacancy)
              setError(null)
            }}
            disabled={off || busy}
            data-cw-match-sample=""
          >
            {copy.sample}
          </Button>
        </div>
      </form>

      <div role="status" aria-live="polite" className={styles.status} data-cw-match-status="">
        {errorText ? <p className={styles.error}>{errorText}</p> : null}
        {busy ? <p>{copy.analyzing}</p> : null}
      </div>

      {result ? (
        <div className={styles.result} ref={resultRef} tabIndex={-1} data-cw-match-result="" data-mode={result.mode}>
          <Report result={result} copy={copy} lang={lang} />
          <div className={styles.row}>
            <Button variant="solid" onClick={() => setPrinting(true)} data-cw-match-print-button="">
              {copy.print}
            </Button>
            <a className={styles.link} href={contactHref(lang, result.role)} data-cw-match-contact="">
              {copy.contact}
            </a>
            <Button variant="ghost" onClick={reset} data-cw-match-again="">
              {copy.again}
            </Button>
          </div>
        </div>
      ) : null}

      {result && printing
        ? createPortal(
            <div className={styles.print} data-cw-match-print="">
              <Report result={result} copy={copy} lang={lang} printable />
              <p className={styles.muted}>{fill(copy.site, { url: origin, date })}</p>
            </div>,
            document.body,
          )
        : null}
    </section>
  )
}
