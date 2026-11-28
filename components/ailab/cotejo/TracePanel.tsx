import { COTEJO_TRACE_TRUTH } from '@/content/ailab/cotejo/truth'
import { scoreTrace } from '@/lib/ailab/cotejo/metrics'
import { TRACE_VARIANTS, type TraceRowView, type TraceView } from '@/lib/ailab/cotejo/protocol'
import type { Locale } from '@/lib/i18n/config'
import { Button } from '@/components/ui/Button'
import { cotejoMs, cotejoNumber, cotejoText } from './copy'
import styles from './CotejoStage.module.scss'

export type TracePhase = 'idle' | 'loading' | 'ready' | 'failed'

export type TracePanelProps = {
  lang: Locale
  phase: TracePhase
  view: TraceView | null
  sample: boolean
  disabled: boolean
  onRun: () => void
}

export const TRACE_INDEX_BYTES = 1_014_239

function Row({ lang, row, truth }: { lang: Locale; row: TraceRowView; truth: (typeof COTEJO_TRACE_TRUTH)[number] | undefined }) {
  const text = cotejoText(lang)
  const verdict = truth ? (truth.exists ? (row.top.slice(0, 3).some((hit) => truth.files.some((file) => hit.path.startsWith(file))) ? 'hit' : 'miss') : 'absent') : null
  return (
    <li className={styles.traceRow} data-cw-cotejo-trace-row={row.unitId ?? ''} data-confidence={row.confidence}>
      <p className={styles.para}>
        <strong>{row.unitId}</strong> · {text(`cotejo.trace.confidence.${row.confidence}`)}
        {row.line ? ` · ${text('cotejo.finding.line', { line: row.line })}` : ''}
      </p>
      <p className={styles.muted}>{row.text}</p>
      <ol className={styles.hits}>
        {row.top.map((hit) => (
          <li key={hit.path}>
            <code className={styles.path}>{hit.path}</code>
            <span className={styles.muted}>
              {' '}
              {text('cotejo.trace.score', {
                score: cotejoNumber(hit.score, lang, 1),
                bm25: cotejoNumber(hit.scores.bm25, lang, 1),
                bridge: cotejoNumber(hit.scores.bridge, lang, 1),
                id: hit.scores.idLiteral,
              })}
              {hit.magnet ? ` · ${text('cotejo.trace.magnet')}` : ''}
            </span>
            {hit.terms.length > 0 ? <span className={styles.muted}> · {text('cotejo.trace.terms', { terms: hit.terms.join(', ') })}</span> : null}
          </li>
        ))}
      </ol>
      {row.bridged.length > 0 ? <p className={styles.muted}>{text('cotejo.trace.bridged', { terms: row.bridged.slice(0, 8).join(', ') })}</p> : null}
      {verdict ? (
        <p className={verdict === 'hit' ? styles.truthHit : styles.truthMiss} data-cw-cotejo-trace-truth={verdict}>
          {text(`cotejo.trace.truth.${verdict}`)}
        </p>
      ) : null}
    </li>
  )
}

export function TracePanel({ lang, phase, view, sample, disabled, onRun }: TracePanelProps) {
  const text = cotejoText(lang)
  const rows = view ? view.variants.glossary.filter((row) => row.confidence !== 'baja') : []
  const truth = new Map(COTEJO_TRACE_TRUTH.map((item) => [item.unitId, item]))
  return (
    <section className={styles.panel} aria-labelledby="cotejo-trace-title" data-cw-cotejo-trace={phase}>
      <h4 id="cotejo-trace-title" className={styles.panelTitle}>
        {text('cotejo.trace.title')}
      </h4>
      <p className={styles.para}>{text('cotejo.trace.intro')}</p>
      {phase !== 'ready' ? (
        <div className={styles.row}>
          <Button variant="glass" size="sm" onClick={onRun} disabled={disabled || phase === 'loading'} aria-busy={phase === 'loading' || undefined} data-cw-cotejo-trace-run="">
            {text('cotejo.trace.run')}
          </Button>
          <span className={styles.muted}>{text('cotejo.trace.size', { size: `${cotejoNumber(TRACE_INDEX_BYTES / 1_000_000, lang, 1)} MB` })}</span>
        </div>
      ) : null}
      {phase === 'loading' ? (
        <p className={styles.muted} role="status">
          {text('cotejo.trace.loading')}
        </p>
      ) : null}
      {phase === 'failed' ? (
        <p className={styles.error} role="alert">
          {text('cotejo.trace.failed')}
        </p>
      ) : null}
      {view ? (
        <>
          <p className={styles.muted} data-cw-cotejo-trace-meta="">
            {text('cotejo.trace.meta', { date: view.generatedAt ?? '—', files: view.files, magnets: view.magnets, ms: cotejoMs(view.ms, lang) })}
          </p>
          {sample ? (
            <div className={styles.tableWrap} role="region" aria-label={text('cotejo.trace.variants.caption')} tabIndex={0}>
              <table className={styles.table} data-cw-cotejo-trace-variants="">
                <caption>{text('cotejo.trace.variants.caption')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{text('cotejo.trace.col.variant')}</th>
                    <th scope="col">{text('cotejo.trace.col.hits')}</th>
                    <th scope="col">{text('cotejo.trace.col.quiet')}</th>
                  </tr>
                </thead>
                <tbody>
                  {TRACE_VARIANTS.map((variant) => {
                    const score = scoreTrace(view.variants[variant], COTEJO_TRACE_TRUTH)
                    return (
                      <tr key={variant} data-cw-cotejo-trace-variant={variant} data-hits={score.hits}>
                        <th scope="row">{text(`cotejo.trace.variant.${variant}`)}</th>
                        <td>{text('cotejo.trace.ratio', { part: score.hits, whole: score.existing })}</td>
                        <td>{text('cotejo.trace.ratio', { part: score.quiet, whole: score.absent })}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {sample ? <p className={styles.muted}>{text('cotejo.trace.optimistic')}</p> : null}
          <p className={styles.label}>{text('cotejo.trace.list', { count: rows.length })}</p>
          {rows.length === 0 ? (
            <p className={styles.muted}>{text('cotejo.trace.none')}</p>
          ) : (
            <ul className={styles.plain}>
              {rows.map((row) => (
                <Row key={`${row.unitId}-${row.line}`} lang={lang} row={row} truth={sample && row.unitId ? truth.get(row.unitId) : undefined} />
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  )
}
