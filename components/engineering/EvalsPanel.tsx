import Link from 'next/link'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { EVAL_KINDS } from '@/content/ailab/evals/battery'
import { evalsCopy } from '@/content/ailab/evals/copy'
import { toCop } from '@/lib/ai/pricing'
import type { Dashboard, EvalsRow } from '@/lib/engineering/dashboard'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { dateTime, integer, usd } from './format'
import styles from './Engineering.module.scss'

type Props = { lang: Locale; dict: Dictionary; dashboard: Dashboard }

export const EVALS_SECTION_ID = 'eng-evals'

function percent(passed: number, total: number, lang: Locale): string {
  return total ? `${integer(Math.round((passed / total) * 100), lang)} %` : '—'
}

function Battery({ lang, dict, row }: { lang: Locale; dict: Dictionary; row: EvalsRow }) {
  const { entry, latest, problem } = row
  const kinds = evalsCopy[lang].kinds
  return (
    <article className={styles.battery} data-cw-eng-evals={entry.id} data-cw-eng-evals-state={problem ? 'invalid' : latest ? 'run' : 'empty'}>
      <h3 className={styles.h3}>{entry.title[lang]}</h3>
      {problem ? (
        <p className={styles.warn}>{t(dict, 'engineering.evals.invalid', { reason: problem })}</p>
      ) : latest ? (
        <>
          <dl className={styles.stats}>
            <div>
              <dt>{t(dict, 'engineering.evals.latest')}</dt>
              <dd>
                <time dateTime={latest.at}>{dateTime(latest.at, lang)}</time>
              </dd>
            </div>
            <div>
              <dt>{t(dict, 'engineering.evals.passed')}</dt>
              <dd>
                {integer(latest.totals.passed, lang)}/{integer(latest.totals.cases, lang)} · {percent(latest.totals.passed, latest.totals.cases, lang)}
              </dd>
            </div>
            <div>
              <dt>{t(dict, 'engineering.evals.latency')}</dt>
              <dd>
                p50 {integer(latest.latency.p50, lang)} ms · p95 {integer(latest.latency.p95, lang)} ms
              </dd>
            </div>
            <div>
              <dt>{t(dict, 'engineering.evals.cost')}</dt>
              <dd>
                {usd(latest.costUsd, lang)} USD · {integer(toCop(latest.costUsd), lang)} COP
              </dd>
            </div>
            <div>
              <dt>{t(dict, 'engineering.evals.model')}</dt>
              <dd>{latest.model}</dd>
            </div>
            <div>
              <dt>{t(dict, 'engineering.evals.runs')}</dt>
              <dd>{integer(row.runs, lang)}</dd>
            </div>
          </dl>
          <ul className={styles.kinds}>
            {EVAL_KINDS.map((kind) => (
              <li key={kind}>
                <span>{kinds[kind]}</span>
                <strong>
                  {integer(latest.byKind[kind].passed, lang)}/{integer(latest.byKind[kind].total, lang)}
                </strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className={styles.headline}>{t(dict, 'engineering.evals.empty')}</p>
          <p>{t(dict, 'engineering.evals.how', { command: entry.command, cost: entry.costPerRun[lang] })}</p>
        </>
      )}
      <p>
        <Link className={styles.link} href={`/${lang}${entry.href}`}>
          {t(dict, 'engineering.evals.board')}
        </Link>
      </p>
      <p className={styles.source}>
        <strong>{t(dict, 'engineering.source')}:</strong> {t(dict, 'engineering.evals.source', { file: entry.resultsFile })}
      </p>
    </article>
  )
}

export function EvalsPanel({ lang, dict, dashboard }: Props) {
  return (
    <GlassSurface as="section" id={EVALS_SECTION_ID} className={styles.panel} aria-labelledby="eng-evals-title">
      <h2 id="eng-evals-title" className={styles.h2}>
        {t(dict, 'engineering.evals.title')}
      </h2>
      {dashboard.evals.map((row) => (
        <Battery key={row.entry.id} lang={lang} dict={dict} row={row} />
      ))}
    </GlassSurface>
  )
}
