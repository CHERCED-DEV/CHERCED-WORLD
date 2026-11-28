import { memo } from 'react'
import type { SampleScore } from '@/lib/ailab/cotejo/metrics'
import type { Locale } from '@/lib/i18n/config'
import { cotejoRatio, cotejoText } from './copy'
import styles from './CotejoStage.module.scss'

export type CotejoMetricsProps = { lang: Locale; score: SampleScore; semanticOn: boolean }

export const CotejoMetrics = memo(function CotejoMetrics({ lang, score, semanticOn }: CotejoMetricsProps) {
  const text = cotejoText(lang)
  const missed = score.missed.map((defect) => defect.id).join(', ')
  return (
    <section className={styles.panel} aria-labelledby="cotejo-metrics-title" data-cw-cotejo-metrics="">
      <h4 id="cotejo-metrics-title" className={styles.panelTitle}>
        {text('cotejo.metrics.title')}
      </h4>
      <dl className={styles.metrics}>
        <div className={styles.metric}>
          <dt>{text('cotejo.metrics.precision')}</dt>
          <dd data-cw-cotejo-precision={score.precision ?? ''}>
            <strong>{cotejoRatio(score.precision, lang)}</strong>
            <span className={styles.muted}>{text('cotejo.metrics.precisionDetail', { tp: score.truePositives, n: score.findings })}</span>
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>{text('cotejo.metrics.recall')}</dt>
          <dd data-cw-cotejo-recall={score.recall ?? ''}>
            <strong>{cotejoRatio(score.recall, lang)}</strong>
            <span className={styles.muted}>{text('cotejo.metrics.recallDetail', { found: score.found, defects: score.defects })}</span>
          </dd>
        </div>
        <div className={styles.metric}>
          <dt>{text('cotejo.metrics.f1')}</dt>
          <dd>
            <strong>{cotejoRatio(score.f1, lang)}</strong>
          </dd>
        </div>
      </dl>
      <p className={styles.para} data-cw-cotejo-layer="C1">
        {text('cotejo.metrics.c1', { found: score.byLayer.C1.found, defects: score.byLayer.C1.defects })}
      </p>
      <p className={styles.para} data-cw-cotejo-layer="C3">
        {text(semanticOn ? 'cotejo.metrics.semanticOn' : 'cotejo.metrics.semantic', { count: score.byLayer.C3.defects, found: score.byLayer.C3.found })}
      </p>
      {score.falsePositives > 0 ? <p className={styles.para}>{text('cotejo.metrics.falsePositives', { count: score.falsePositives })}</p> : null}
      <p className={styles.muted}>{text('cotejo.metrics.trace')}</p>
      <details className={styles.more}>
        <summary>{text('cotejo.metrics.family.caption')}</summary>
        <div className={styles.tableWrap} role="region" aria-label={text('cotejo.metrics.family.caption')} tabIndex={0}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{text('cotejo.metrics.col.family')}</th>
                <th scope="col">{text('cotejo.metrics.col.seeded')}</th>
                <th scope="col">{text('cotejo.metrics.col.found')}</th>
                <th scope="col">{text('cotejo.metrics.col.findings')}</th>
                <th scope="col">{text('cotejo.metrics.col.fp')}</th>
              </tr>
            </thead>
            <tbody>
              {score.byFamily.map((row) => (
                <tr key={row.family} data-cw-cotejo-family-score={row.family}>
                  <th scope="row">{text(`cotejo.family.${row.family}`)}</th>
                  <td>{row.seeded}</td>
                  <td>{row.found}</td>
                  <td>{row.findings}</td>
                  <td>{row.falsePositives}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {missed ? <p className={styles.muted}>{text('cotejo.metrics.missed', { list: missed })}</p> : null}
      </details>
    </section>
  )
})
