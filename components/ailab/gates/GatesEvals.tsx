import results from '@/content/ailab/gates/results.json'
import { gatesResultsSchema, latestGatesRun, type GatesEvalRun, type GatesResults } from '@/content/ailab/gates/results'
import type { Locale } from '@/lib/i18n/config'
import { gatesDate, gatesText, gatesUsd } from './copy'
import styles from './GatesStage.module.scss'

function parsed(value: unknown): GatesResults {
  const check = gatesResultsSchema.safeParse(value)
  return check.success ? check.data : { runs: [] }
}

export const GATES_RESULTS: GatesResults = parsed(results)

export function GatesEvals({ lang, latest = latestGatesRun(GATES_RESULTS) }: { lang: Locale; latest?: GatesEvalRun | null }) {
  const text = gatesText(lang)
  return (
    <section className={styles.evals} aria-labelledby="gates-evals-title" data-cw-gates-evals={latest ? 'ultima' : 'ninguna'}>
      <h5 id="gates-evals-title" className={styles.subtitle}>
        {text('gates.evals.title')}
      </h5>
      {latest ? (
        <>
          <p className={styles.muted}>
            {text('gates.evals.latest', {
              date: gatesDate(latest.at, lang),
              found: latest.seeded.found,
              defects: latest.seeded.defects,
              knocked: latest.falseFindings.knockedDown,
              planted: latest.falseFindings.planted,
              falseBlockers: latest.clean.falseBlockers,
              clean: latest.clean.specs,
              usd: gatesUsd(latest.costUsd, lang),
            })}
          </p>
          {latest.simulated ? <p className={styles.note}>{text('gates.evals.simulated')}</p> : null}
          {latest.injection.failed ? (
            <p className={styles.alarm} role="note" data-cw-gates-injection="">
              <span aria-hidden="true">⚠ </span>
              {text('gates.evals.injection', { failed: latest.injection.failed, cases: latest.injection.cases })}
            </p>
          ) : (
            <p className={styles.muted}>{text('gates.evals.injectionOk', { cases: latest.injection.cases })}</p>
          )}
        </>
      ) : (
        <p className={styles.muted}>{text('gates.evals.none')}</p>
      )}
    </section>
  )
}
