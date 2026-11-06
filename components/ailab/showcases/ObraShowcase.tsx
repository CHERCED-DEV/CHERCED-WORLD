'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { CodeBlock } from '@/components/blog/mdx/CodeBlock'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import {
  OBRA_CONTINGENCY,
  OBRA_LIMITS,
  OBRA_LOG,
  OBRA_PRICES,
  OBRA_SAMPLE,
  OBRA_STEEL_RATIOS,
  OBRA_UNIT_SYMBOL,
  type ObraField,
} from '@/content/ailab/showcases/obra'
import { formatBytes } from '@/lib/ailab/core/format'
import { ESTIMATE_FILE, ESTIMATE_PY } from '@/lib/ailab/pyodide/estimate-source'
import {
  OBRA_FIELDS,
  entryText,
  formatDecimal,
  formatMoney,
  formatPercent,
  formatQuantity,
  initialDraft,
  inputKey,
  obraInput,
  readDraft,
  type ObraDraft,
} from '@/lib/ailab/pyodide/input'
import { ESTIMATE_ENTRY, OBRA_STAGES, type ObraEstimated } from '@/lib/ailab/pyodide/protocol'
import { MadeUp } from './MadeUp'
import styles from './Showcases.module.scss'
import { useObraPython } from './use-obra-python'

export const RECALC_DELAY_MS = 250

type Computed = { key: string; estimated: ObraEstimated; payload: string }

export function ObraShowcase({ lang, t, experiment, downloads }: LabDemoProps) {
  const uid = useId()
  const [draft, setDraft] = useState<ObraDraft>(() => initialDraft(lang))
  const [computed, setComputed] = useState<Computed | null>(null)
  const [runs, setRuns] = useState(0)
  const [calcFailed, setCalcFailed] = useState(false)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const python = useObraPython({ experiment, downloads, source: ESTIMATE_PY })
  const { phase, stage, runtime, paused, notice } = python.state
  const reading = useMemo(() => readDraft(draft), [draft])
  const input = useMemo(() => (reading.values ? obraInput(reading.values) : null), [reading])
  const key = input ? inputKey(input) : null
  const computedKey = computed?.key ?? null
  const hasComputed = computed !== null
  const { estimate } = python
  const stale = computed !== null && computed.key !== key
  const size = formatBytes(
    downloads.reduce((sum, download) => sum + download.bytes, 0),
    lang,
  )
  const host = downloads[0]?.host ?? 'cdn.jsdelivr.net'

  useEffect(() => {
    if (phase !== 'ready' || !input || !key || computedKey === key) return
    const controller = new AbortController()
    const timer = window.setTimeout(
      () => {
        estimate(input, controller.signal).then(
          (estimated) => {
            if (controller.signal.aborted) return
            setComputed({ key, estimated, payload: JSON.stringify(input, null, 2) })
            setRuns((value) => value + 1)
            setCalcFailed(false)
          },
          (error: unknown) => {
            if (controller.signal.aborted || (error as { name?: string } | null)?.name === 'AbortError') return
            setCalcFailed(true)
          },
        )
      },
      hasComputed ? RECALC_DELAY_MS : 0,
    )
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [phase, input, key, computedKey, hasComputed, estimate])

  const update = (id: string, field: ObraField, value: string) => {
    setDraft((current) => ({ ...current, [id]: { ...current[id]!, [field]: value } }))
  }

  const ids = {
    title: `${uid}-title`,
    log: `${uid}-log`,
    prices: `${uid}-prices`,
    python: `${uid}-python`,
    result: `${uid}-result`,
    code: `${uid}-code`,
  }
  const result = computed?.estimated.estimate ?? null
  const broken = calcFailed && phase === 'ready'
  const canRun = phase === 'idle' || phase === 'declined' || phase === 'failed' || broken
  const starting = phase === 'asking' || phase === 'loading'

  useEffect(() => {
    if (phase === 'ready' && document.activeElement === document.body) statusRef.current?.focus()
  }, [phase])

  const run = () => {
    if (starting) return
    setCalcFailed(false)
    void python.activate()
  }

  const status =
    phase === 'idle' ? t('ailab.a4.obra.idle', { size, host })
    : phase === 'asking' ? t('ailab.a4.obra.asking')
    : phase === 'declined' ? t('ailab.a4.obra.declined')
    : phase === 'loading' ? t(`ailab.a4.obra.stage.${stage ?? 'core'}`)
    : phase === 'failed' ? t('ailab.a4.obra.failed')
    : runtime ? t('ailab.a4.obra.ready', { pyodide: runtime.pyodide, python: runtime.python, numpy: runtime.numpy })
    : ''

  return (
    <article className={styles.showcase} aria-labelledby={ids.title} data-cw-showcase="obra">
      <header className={styles.intro}>
        <MadeUp text={t('ailab.a4.obra.madeUp')} />
        <h5 id={ids.title} className={styles.title}>
          {OBRA_SAMPLE.title[lang]}
        </h5>
        <p className={styles.lead}>{OBRA_SAMPLE.summary[lang]}</p>
      </header>

      <div className={styles.columns}>
        <div className={styles.stack}>
          <section className={styles.block} aria-labelledby={ids.log} data-cw-obra="log">
            <h6 id={ids.log} className={styles.blockTitle}>
              {t('ailab.a4.obra.log')}
            </h6>
            <p className={styles.note}>{t('ailab.a4.obra.log.hint')}</p>
            <ol className={styles.entries}>
              {OBRA_LOG.map((entry) => {
                const row = draft[entry.id]!
                const errors = reading.errors[entry.id] ?? {}
                const item = !stale ? result?.items.find((candidate) => candidate.id === entry.id) : undefined
                return (
                  <li key={entry.id} className={styles.entry} data-cw-obra-entry={entry.id}>
                    <p className={styles.entryDay}>{t('ailab.a4.obra.day', { day: entry.day })}</p>
                    <p className={styles.entryText} data-cw-obra-text="">
                      {entryText(entry, row, lang)}
                    </p>
                    <div className={styles.fields} role="group" aria-label={t('ailab.a4.obra.values', { id: entry.id })}>
                      {OBRA_FIELDS.map((field) => {
                        const inputId = `${uid}-${entry.id}-${field}`
                        const limits = OBRA_LIMITS[field]
                        const invalid = errors[field] === true
                        return (
                          <div key={field} className={styles.field}>
                            <label htmlFor={inputId} className={styles.fieldLabel}>
                              {field === 'count' ? t('ailab.a4.obra.field.count') : t('ailab.a4.obra.field.dim', { label: entry.labels[field][lang] })}
                            </label>
                            <input
                              id={inputId}
                              className={styles.input}
                              type="text"
                              inputMode={limits.integer ? 'numeric' : 'decimal'}
                              autoComplete="off"
                              spellCheck={false}
                              value={row[field]}
                              onChange={(event) => update(entry.id, field, event.target.value)}
                              aria-invalid={invalid || undefined}
                              aria-describedby={invalid ? `${inputId}-error` : undefined}
                              data-cw-obra-field={`${entry.id}:${field}`}
                            />
                            {invalid ? (
                              <span id={`${inputId}-error`} className={styles.fieldError} data-cw-obra-error="">
                                {limits.integer
                                  ? t('ailab.a4.obra.error.count', { min: limits.min, max: limits.max })
                                  : t('ailab.a4.obra.error.dim', { min: formatDecimal(limits.min, lang), max: formatDecimal(limits.max, lang) })}
                              </span>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                    {item ? (
                      <p className={styles.entryResult} data-cw-obra-computed={entry.id}>
                        {t('ailab.a4.obra.computed', {
                          volume: formatQuantity(item.volume, lang),
                          formwork: formatQuantity(item.formwork, lang),
                          steel: formatQuantity(item.steel, lang, 0),
                        })}
                      </p>
                    ) : null}
                  </li>
                )
              })}
            </ol>
            <div className={styles.inlineActions}>
              <Button variant="ghost" onClick={() => setDraft(initialDraft(lang))} data-cw-obra-reset="">
                {t('ailab.a4.obra.reset')}
              </Button>
            </div>
          </section>

          <section className={styles.block} aria-labelledby={ids.prices} data-cw-obra="prices">
            <h6 id={ids.prices} className={styles.blockTitle}>
              {t('ailab.a4.obra.prices')}
            </h6>
            <p className={styles.note} data-cw-obra-example="">
              {OBRA_SAMPLE.examplePrices[lang]}
            </p>
            <ul className={styles.prices}>
              {OBRA_PRICES.map((price) => (
                <li key={price.id} className={styles.price} data-cw-obra-price={price.id} data-example="">
                  <span>{price.label[lang]}</span>
                  <span className={styles.priceValue}>
                    {t('ailab.a4.obra.perUnit', { price: formatMoney(price.value, lang), unit: OBRA_UNIT_SYMBOL[price.unit] })}
                    <span className={styles.exampleTag}>{t('ailab.a4.obra.example')}</span>
                  </span>
                </li>
              ))}
              <li className={styles.price} data-cw-obra-price="ratios" data-example="">
                <span>{t('ailab.a4.obra.ratios')}</span>
                <span className={styles.priceValue}>
                  {Object.values(OBRA_STEEL_RATIOS)
                    .map((ratio) => `${ratio.label[lang]} ${ratio.value}`)
                    .join(' · ')}{' '}
                  kg/m³
                  <span className={styles.exampleTag}>{t('ailab.a4.obra.example')}</span>
                </span>
              </li>
              <li className={styles.price} data-cw-obra-price="contingency" data-example="">
                <span>{t('ailab.a4.obra.contingencyRate')}</span>
                <span className={styles.priceValue}>
                  {formatPercent(OBRA_CONTINGENCY.value, lang)}
                  <span className={styles.exampleTag}>{t('ailab.a4.obra.example')}</span>
                </span>
              </li>
            </ul>
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.block} aria-labelledby={ids.python} data-cw-obra="python" data-phase={phase}>
            <h6 id={ids.python} className={styles.blockTitle}>
              {t('ailab.a4.obra.python')}
            </h6>
            <p ref={statusRef} tabIndex={-1} className={styles.status} role="status" data-cw-obra-status={phase}>
              {status}
            </p>
            {phase === 'loading' ? (
              <progress
                className={styles.meter}
                max={OBRA_STAGES.length}
                value={OBRA_STAGES.indexOf(stage ?? 'core') + 1}
                aria-label={t('ailab.a4.obra.progress')}
              />
            ) : null}
            {notice === 'evicted' ? <p className={styles.notice}>{t('ailab.worker.evicted')}</p> : null}
            {notice === 'revoked' ? <p className={styles.notice}>{t('ailab.a4.obra.revoked')}</p> : null}
            {paused && (phase === 'loading' || phase === 'ready') ? <p className={styles.notice}>{t('ailab.worker.paused')}</p> : null}
            {broken ? (
              <p className={styles.notice} role="alert" data-cw-obra-calc-failed="">
                {t('ailab.a4.obra.calcFailed')}
              </p>
            ) : null}
            {canRun || starting ? (
              <div className={styles.inlineActions}>
                <Button variant="solid" onClick={run} aria-disabled={starting || undefined} data-cw-obra-run="">
                  {phase === 'failed' || broken ? t('ailab.a4.obra.retry') : t('ailab.a4.obra.run')}
                </Button>
              </div>
            ) : null}
          </section>

          <section className={styles.block} aria-labelledby={ids.result} data-cw-obra="result" aria-busy={(phase === 'ready' && stale) || undefined}>
            <h6 id={ids.result} className={styles.blockTitle}>
              {t('ailab.a4.obra.result')}
            </h6>
            {result ? (
              <>
                {stale ? (
                  <p className={styles.notice} data-cw-obra-stale="">
                    {reading.values ? t('ailab.a4.obra.recalculating') : t('ailab.a4.obra.invalid')}
                  </p>
                ) : null}
                <table className={styles.table} data-stale={stale || undefined}>
                  <thead>
                    <tr>
                      <th scope="col">{t('ailab.a4.obra.col.item')}</th>
                      <th scope="col">{t('ailab.a4.obra.col.cost')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lines.map((line) => {
                      const price = OBRA_PRICES.find((candidate) => candidate.id === line.id)
                      return (
                        <tr key={line.id} data-cw-obra-line={line.id}>
                          <th scope="row">
                            <span className={styles.lineName}>{price?.label[lang] ?? line.id}</span>
                            <span className={styles.lineMath}>
                              {t('ailab.a4.obra.line', {
                                quantity: formatQuantity(line.quantity, lang, line.unit === 'kg' ? 0 : 2),
                                unit: OBRA_UNIT_SYMBOL[line.unit],
                                price: formatMoney(line.price, lang),
                              })}
                            </span>
                          </th>
                          <td>{formatMoney(line.cost, lang)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">{t('ailab.a4.obra.subtotal')}</th>
                      <td>{formatMoney(result.subtotal, lang)}</td>
                    </tr>
                    <tr>
                      <th scope="row">{t('ailab.a4.obra.contingency', { rate: formatPercent(OBRA_CONTINGENCY.value, lang) })}</th>
                      <td>{formatMoney(result.contingency, lang)}</td>
                    </tr>
                    <tr className={styles.totalRow} data-cw-obra-total="">
                      <th scope="row">{t('ailab.a4.obra.total')}</th>
                      <td>{formatMoney(result.total, lang)}</td>
                    </tr>
                  </tfoot>
                </table>
                <p className={styles.note} data-cw-obra-ms="">
                  {t('ailab.a4.obra.ms', { ms: formatDecimal(computed!.estimated.ms, lang, 1) })}
                </p>
              </>
            ) : (
              <p className={styles.note}>{t('ailab.a4.obra.noResult')}</p>
            )}
            <p className="cw-visually-hidden" aria-live="polite" data-cw-obra-announce="">
              {result && !stale ? t('ailab.a4.obra.announce', { total: formatMoney(result.total, lang) }) : ''}
            </p>
          </section>
        </div>
      </div>

      <section className={styles.block} aria-labelledby={ids.code} data-cw-obra="code">
        <h6 id={ids.code} className={styles.blockTitle}>
          {t('ailab.a4.obra.code')}
        </h6>
        <p className={styles.note} data-cw-obra-runs={runs}>
          {runs > 0 && computed
            ? t('ailab.a4.obra.code.ran', { entry: `${ESTIMATE_ENTRY}()`, runs, ms: formatDecimal(computed.estimated.ms, lang, 1) })
            : t('ailab.a4.obra.code.pending', { file: ESTIMATE_FILE })}
        </p>
        <div className={styles.codeBox} data-cw-obra-source="">
          <CodeBlock labels={{ copy: t('ailab.a4.obra.copy'), copied: t('ailab.a4.obra.copied'), copyError: t('ailab.a4.obra.copyError') }}>
            <code className="language-python">{ESTIMATE_PY}</code>
          </CodeBlock>
        </div>
        {computed ? (
          <details className={styles.call} data-cw-obra-call="">
            <summary className={styles.callSummary}>{t('ailab.a4.obra.call', { entry: `${ESTIMATE_ENTRY}()` })}</summary>
            <pre className={styles.callBody} tabIndex={0}>
              <code>{computed.payload}</code>
            </pre>
          </details>
        ) : null}
      </section>
    </article>
  )
}
