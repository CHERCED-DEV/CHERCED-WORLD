'use client'

import { useDeferredValue, useEffect, useId, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import type { LabDemoProps, LabTranslate } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import { createGlassBox, type GlassBox, type GlassField, type GlassMatch, type GlassResult, type GlassTerm } from '@/lib/ailab/search/glassbox'
import type { Locale } from '@/lib/i18n/config'
import { loadSearchIndex } from '@/lib/search/client'
import type { SearchDocKind } from '@/lib/search/types'
import styles from './GlassBox.module.scss'

const NUMBER_LOCALE: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

const KIND_KEYS: Record<SearchDocKind, string> = {
  page: 'ailab.a5.kind.page',
  project: 'ailab.a5.kind.project',
  post: 'ailab.a5.kind.post',
  section: 'ailab.a5.kind.section',
  skill: 'ailab.a5.kind.skill',
}

const FIELD_KEYS: Record<GlassField, string> = {
  title: 'ailab.a5.field.title',
  keywords: 'ailab.a5.field.keywords',
  text: 'ailab.a5.field.text',
}

const MATCH_KEYS: Record<GlassMatch['kind'], string> = {
  exact: 'ailab.a5.match.exact',
  prefix: 'ailab.a5.match.prefix',
  fuzzy: 'ailab.a5.match.fuzzy',
}

const EXAMPLE_KEYS = ['ailab.a5.example.one', 'ailab.a5.example.two', 'ailab.a5.example.three'] as const

type IndexState = { phase: 'loading' } | { phase: 'ready'; box: GlassBox } | { phase: 'failed' }

function useGlassBox(lang: Locale, attempt: number): IndexState {
  const [state, setState] = useState<{ key: string; value: IndexState }>({ key: '', value: { phase: 'loading' } })
  const key = `${lang}:${attempt}`
  useEffect(() => {
    let alive = true
    loadSearchIndex(lang).then(
      (index) => alive && setState({ key, value: { phase: 'ready', box: createGlassBox(index) } }),
      () => alive && setState({ key, value: { phase: 'failed' } }),
    )
    return () => {
      alive = false
    }
  }, [lang, key])
  return state.key === key ? state.value : { phase: 'loading' }
}

function Where({ term, t }: { term: GlassTerm; t: LabTranslate }) {
  const parts = term.matches.map((match) => {
    const field = t(FIELD_KEYS[match.field], { boost: match.boost })
    return t(MATCH_KEYS[match.kind], { field, word: match.word })
  })
  return <>{t('ailab.a5.term.where', { places: [...new Set(parts)].join('; ') })}</>
}

function Why({ result, t, format, total }: { result: GlassResult; t: LabTranslate; format: (value: number) => string; total: number }) {
  return (
    <details className={styles.why} data-cw-glass-why="">
      <summary className={styles.whySummary}>{t('ailab.a5.why')}</summary>
      <ul className={styles.terms}>
        {result.terms.map((term) => (
          <li key={term.term} className={styles.term} data-cw-glass-term={term.term}>
            <p className={styles.termHead}>
              <strong>{t('ailab.a5.term.score', { term: term.term, score: format(term.score) })}</strong>
              {term.occurrences > 1 ? <span>{t('ailab.a5.term.repeated', { count: term.occurrences })}</span> : null}
            </p>
            <p>
              <Where term={term} t={t} />
            </p>
            <p className={styles.muted}>{t('ailab.a5.term.documents', { count: term.documents, total })}</p>
          </li>
        ))}
      </ul>
      <p className={styles.total} data-cw-glass-total="">
        {t('ailab.a5.total', { sum: format(result.sum), matched: result.matchedTerms, score: format(result.score) })}
      </p>
    </details>
  )
}

function Result({ result, t, format, total }: { result: GlassResult; t: LabTranslate; format: (value: number) => string; total: number }) {
  const share = { '--glass-share': result.share.toFixed(4) } as CSSProperties
  return (
    <li className={styles.result} data-cw-glass-result={result.doc.id}>
      <div className={styles.resultHead}>
        <span className={styles.rank} aria-hidden="true">
          {String(result.rank).padStart(2, '0')}
        </span>
        <a className={styles.title} href={result.doc.url} data-cw-glass-link="">
          {result.doc.title}
        </a>
        <span className={styles.score} data-cw-glass-score={result.score}>
          {t('ailab.a5.score', { score: format(result.score) })}
        </span>
      </div>
      <span className={styles.bar} style={share} aria-hidden="true" />
      <p className={styles.source} data-cw-glass-source="">
        <span className={styles.kind}>{t(KIND_KEYS[result.doc.kind])}</span>
        <span className={styles.url}>{result.doc.url}</span>
      </p>
      {result.fragment ? (
        <p className={styles.fragment} data-cw-glass-fragment={result.fragment.field}>
          {result.fragment.field === 'keywords' ? <span className={styles.fragmentLabel}>{t('ailab.a5.keywords')} </span> : null}
          {result.fragment.segments.map((segment, index) => (segment.hit ? <mark key={index}>{segment.text}</mark> : <span key={index}>{segment.text}</span>))}
        </p>
      ) : null}
      <Why result={result} t={t} format={format} total={total} />
    </li>
  )
}

export function GlassBoxSearch({ lang, t }: LabDemoProps) {
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const state = useGlassBox(lang, attempt)
  const deferred = useDeferredValue(query)
  const base = useId().replace(/:/g, '')
  const format = useMemo(() => {
    const formatter = new Intl.NumberFormat(NUMBER_LOCALE[lang], { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return (value: number) => formatter.format(value)
  }, [lang])
  const box = state.phase === 'ready' ? state.box : null
  const found = useMemo(() => (box && deferred.trim() ? box.search(deferred) : null), [box, deferred])

  const submit = (event: FormEvent<HTMLFormElement>) => event.preventDefault()

  const summary = !found
    ? ''
    : found.results.length > 0
      ? t('ailab.a5.count', { count: found.results.length, query: found.query.trim() })
      : t('ailab.a5.empty', { query: found.query.trim() })

  return (
    <div className={styles.demo} data-cw-glassbox={state.phase}>
      <form role="search" className={styles.form} onSubmit={submit} aria-describedby={`${base}-hint`}>
        <label htmlFor={`${base}-query`} className={styles.label}>
          {t('ailab.a5.label')}
        </label>
        <input
          id={`${base}-query`}
          type="search"
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('ailab.a5.placeholder')}
          autoComplete="off"
          enterKeyHint="search"
          disabled={state.phase === 'failed'}
          data-cw-glass-query=""
        />
        <p id={`${base}-hint`} className={styles.hint}>
          {t('ailab.a5.hint')}
        </p>
        <div className={styles.examples}>
          <span className={styles.examplesLabel}>{t('ailab.a5.examples')}</span>
          {EXAMPLE_KEYS.map((key) => (
            <button key={key} type="button" className={styles.chip} onClick={() => setQuery(t(key))} data-cw-glass-example="">
              {t(key)}
            </button>
          ))}
        </div>
      </form>

      <div className={styles.state} role="status" aria-live="polite" aria-atomic="true" data-cw-glass-status="">
        {state.phase === 'loading' ? t('ailab.a5.loading') : null}
        {state.phase === 'failed' ? t('ailab.a5.failed') : null}
        {state.phase === 'ready' && !found ? t('ailab.a5.ready', { count: state.box.size }) : null}
        {found ? summary : null}
      </div>
      {state.phase === 'failed' ? (
        <div>
          <Button variant="glass" onClick={() => setAttempt((value) => value + 1)} data-cw-glass-retry="">
            {t('ailab.a5.retry')}
          </Button>
        </div>
      ) : null}

      {found && found.terms.length > 0 ? (
        <div className={styles.tokens} data-cw-glass-terms="">
          <p className={styles.label}>{t('ailab.a5.terms')}</p>
          <ul className={styles.tokenList}>
            {found.terms.map((term) => (
              <li key={term.term} className={term.documents > 0 ? styles.token : styles.tokenMiss} data-cw-glass-token={term.term}>
                <span className={styles.tokenText}>{term.term}</span>
                <span className={styles.tokenCount}>
                  {term.documents > 0 ? t('ailab.a5.terms.documents', { count: term.documents }) : t('ailab.a5.terms.none')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {found && found.results.length > 0 ? (
        <ol className={styles.results} aria-label={summary} data-cw-glass-results="">
          {found.results.map((result) => (
            <Result key={result.doc.id} result={result} t={t} format={format} total={found.total} />
          ))}
        </ol>
      ) : null}

      <details className={styles.legend}>
        <summary className={styles.whySummary}>{t('ailab.a5.legend.title')}</summary>
        <p>{t('ailab.a5.legend')}</p>
      </details>
      <p className={styles.meaning} data-cw-glass-meaning="">
        {t('ailab.a5.meaning')}
      </p>
    </div>
  )
}

export default GlassBoxSearch
