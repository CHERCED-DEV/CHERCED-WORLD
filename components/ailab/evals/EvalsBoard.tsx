import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { EVAL_BATTERY, EVAL_KINDS } from '@/content/ailab/evals/battery'
import type { EvalsCopy } from '@/content/ailab/evals/copy'
import type { EvalResults, EvalRun } from '@/lib/ai/evals/grade'
import { toCop } from '@/lib/ai/pricing'
import type { Locale } from '@/lib/i18n/config'
import styles from './Evals.module.scss'

type Props = { lang: Locale; copy: EvalsCopy; results: EvalResults; currentHash: string | null }

function caseAnchor(id: string): string {
  return `caso-${id}`
}

function date(value: string, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(value))
}

function money(usd: number, lang: Locale): string {
  const cop = new Intl.NumberFormat(lang === 'es' ? 'es-CO' : 'en-US', { maximumFractionDigits: 0 }).format(toCop(usd))
  return `${usd.toFixed(4)} USD · ${cop} COP`
}

function percent(passed: number, total: number): string {
  return total ? `${Math.round((passed / total) * 100)} %` : '—'
}

function Latest({ run, lang, copy, stale }: { run: EvalRun; lang: Locale; copy: EvalsCopy; stale: boolean }) {
  const red = run.byKind.refusal.passed < run.byKind.refusal.total
  return (
    <GlassSurface as="section" className={styles.panel} aria-labelledby="evals-latest" data-cw-evals-latest="" data-cw-evals-red={red ? '' : undefined}>
      <h2 id="evals-latest" className={styles.h2}>
        {copy.latest} · <time dateTime={run.at}>{date(run.at, lang)}</time>
      </h2>
      {stale ? (
        <p className={styles.stale} data-cw-evals-stale="">
          {copy.stale}
        </p>
      ) : null}
      <dl className={styles.stats}>
        <div>
          <dt>{copy.score}</dt>
          <dd>
            {run.totals.passed}/{run.totals.cases} · {percent(run.totals.passed, run.totals.cases)}
          </dd>
        </div>
        <div>
          <dt>{copy.latency}</dt>
          <dd>
            p50 {run.latency.p50} ms · p95 {run.latency.p95} ms
          </dd>
        </div>
        <div>
          <dt>{copy.cost}</dt>
          <dd>{money(run.costUsd, lang)}</dd>
        </div>
        <div>
          <dt>{copy.model}</dt>
          <dd>{run.model}</dd>
        </div>
      </dl>
      <ul className={styles.kinds}>
        {EVAL_KINDS.map((kind) => {
          const { passed, total } = run.byKind[kind]
          return (
            <li key={kind} className={styles.kind} data-ok={passed === total ? '' : undefined} data-cw-evals-kind={kind}>
              <span>{copy.kinds[kind]}</span>
              <strong>
                {passed}/{total}
              </strong>
            </li>
          )
        })}
      </ul>
      <h3 className={styles.h3}>{copy.failures}</h3>
      {run.failures.length === 0 ? (
        <p>{copy.noFailures}</p>
      ) : (
        <ul className={styles.failures}>
          {run.failures.map((failure) => (
            <li key={failure.caseId} data-cw-evals-failure={failure.caseId}>
              <a href={`#${caseAnchor(failure.caseId)}`} className={styles.case}>
                {copy.kinds[failure.kind]} · {failure.question}
              </a>
              <p>
                <strong>{copy.reasons}:</strong> {failure.reasons.join('; ')}
              </p>
              <p className={styles.answer}>
                <strong>{copy.answer}:</strong> {failure.answer}
              </p>
            </li>
          ))}
        </ul>
      )}
    </GlassSurface>
  )
}

export function EvalsBoard({ lang, copy, results, currentHash }: Props) {
  const [latest, ...older] = results.runs
  return (
    <div className={styles.board} data-cw-evals="">
      <header className={styles.header}>
        <Link href={`/${lang}/ai-lab`} className={styles.back}>
          ← {copy.back}
        </Link>
        <h1 className={styles.h1}>{copy.title}</h1>
        <p className={styles.lead}>{copy.intro}</p>
        <p>{copy.how}</p>
      </header>

      {latest ? (
        <Latest run={latest} lang={lang} copy={copy} stale={currentHash !== null && latest.instructionHash !== currentHash} />
      ) : (
        <GlassSurface as="section" className={styles.panel} data-cw-evals-empty="">
          <h2 className={styles.h2}>{copy.empty}</h2>
          <p>{copy.emptyHow}</p>
        </GlassSurface>
      )}

      {older.length ? (
        <GlassSurface as="section" className={styles.panel} aria-labelledby="evals-history">
          <h2 id="evals-history" className={styles.h2}>
            {copy.history}
          </h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{copy.date}</th>
                  <th scope="col">{copy.score}</th>
                  <th scope="col">{copy.kinds.refusal}</th>
                  <th scope="col">{copy.latency}</th>
                  <th scope="col">{copy.cost}</th>
                </tr>
              </thead>
              <tbody>
                {results.runs.map((run) => (
                  <tr key={run.id}>
                    <td>{date(run.at, lang)}</td>
                    <td>{percent(run.totals.passed, run.totals.cases)}</td>
                    <td>
                      {run.byKind.refusal.passed}/{run.byKind.refusal.total}
                    </td>
                    <td>p50 {run.latency.p50} ms</td>
                    <td>{run.costUsd.toFixed(4)} USD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassSurface>
      ) : null}

      <GlassSurface as="section" className={styles.panel} aria-labelledby="evals-battery">
        <h2 id="evals-battery" className={styles.h2}>
          {copy.battery} ({EVAL_BATTERY.length})
        </h2>
        {EVAL_KINDS.map((kind) => (
          <details key={kind} className={styles.group}>
            <summary>
              {copy.kinds[kind]} · {EVAL_BATTERY.filter((item) => item.kind === kind).length}
            </summary>
            <ol className={styles.cases}>
              {EVAL_BATTERY.filter((item) => item.kind === kind).map((item) => (
                <li key={item.id} id={caseAnchor(item.id)} lang={item.lang}>
                  <code>{item.id}</code> {item.question}
                </li>
              ))}
            </ol>
          </details>
        ))}
      </GlassSurface>
    </div>
  )
}
