import { GlassSurface } from '@/components/ui/GlassSurface'
import type { BudgetSummary } from '@/lib/ai/budget/summary'
import { PAID_PROVIDERS } from '@/lib/ai/providers/types'
import type { Locale } from '@/lib/i18n/config'
import styles from './BudgetCard.module.scss'
import { arenaDate, arenaDay, arenaNumber, arenaText, arenaUsd } from './copy'

export type BudgetCardProps = { lang: Locale; summary: BudgetSummary | null }

export function BudgetCard({ lang, summary }: BudgetCardProps) {
  const text = arenaText(lang)
  if (!summary) {
    return (
      <GlassSurface as="section" variant="subtle" className={styles.card} aria-labelledby="budget-card-title" data-cw-budget-card="unavailable">
        <h3 id="budget-card-title" className={styles.title}>
          {text('arena.budget.title')}
        </h3>
        <p className={styles.alert} role="status">
          {text('arena.budget.unavailable')}
        </p>
      </GlassSurface>
    )
  }
  const meters = [
    { key: 'target', pct: summary.targetPct, label: text('arena.budget.target', { pct: arenaNumber(summary.targetPct, lang), usd: summary.targetUsd }) },
    { key: 'cap', pct: summary.capPct, label: text('arena.budget.cap', { pct: arenaNumber(summary.capPct, lang), usd: summary.capUsd }) },
  ]
  return (
    <GlassSurface as="section" variant="subtle" className={styles.card} aria-labelledby="budget-card-title" data-cw-budget-card={summary.state}>
      <h3 id="budget-card-title" className={styles.title}>
        {text('arena.budget.title')}
      </h3>
      <p className={styles.muted}>{text('arena.budget.intro')}</p>
      <p className={styles.total}>
        <span>{text('arena.budget.spent', { month: summary.month })}</span>
        <strong data-cw-budget-total="">{arenaUsd(summary.usd, lang)} USD</strong>
      </p>
      <div className={styles.meters}>
        {meters.map((meter) => (
          <div key={meter.key} className={styles.meter}>
            <span id={`budget-meter-${meter.key}`}>{meter.label}</span>
            <meter aria-labelledby={`budget-meter-${meter.key}`} min={0} max={100} low={40} high={99} optimum={0} value={Math.min(100, meter.pct)} className={styles.bar} />
          </div>
        ))}
      </div>
      <p className={summary.state === 'ok' ? styles.state : styles.alert} role={summary.state === 'cut' ? 'alert' : undefined} data-cw-budget-state={summary.state}>
        {text(`arena.budget.state.${summary.state}`)}
      </p>
      {summary.warnedAt ? <p className={styles.muted}>{text('arena.budget.warnedAt', { date: arenaDate(summary.warnedAt, lang) })}</p> : null}
      {summary.cutAt ? <p className={styles.muted}>{text('arena.budget.cutAt', { date: arenaDate(summary.cutAt, lang) })}</p> : null}
      <div className={styles.tables}>
        <table className={styles.table}>
          <caption>{text('arena.budget.byProvider')}</caption>
          <thead>
            <tr>
              <th scope="col">{text('arena.budget.column.provider')}</th>
              <th scope="col">{text('arena.budget.column.usd')}</th>
            </tr>
          </thead>
          <tbody>
            {PAID_PROVIDERS.map((provider) => (
              <tr key={provider} data-cw-budget-provider={provider}>
                <th scope="row">{text(`arena.provider.${provider}`)}</th>
                <td>{arenaUsd(summary.byProvider[provider], lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className={styles.table}>
          <caption>{text('arena.budget.byLine')}</caption>
          <thead>
            <tr>
              <th scope="col">{text('arena.budget.column.line')}</th>
              <th scope="col">{text('arena.budget.column.usd')}</th>
            </tr>
          </thead>
          <tbody>
            {summary.byLine.length === 0 ? (
              <tr>
                <td colSpan={2}>{text('arena.budget.noLines')}</td>
              </tr>
            ) : (
              summary.byLine.map((entry) => (
                <tr key={entry.line} data-cw-budget-line={entry.line}>
                  <th scope="row">{text(`arena.line.${entry.line}`)}</th>
                  <td>{arenaUsd(entry.usd, lang)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {summary.pricesToReview.length > 0 ? (
        <p className={styles.alert} data-cw-budget-review="">
          {text('arena.budget.review', { models: summary.pricesToReview.join(', ') })}
        </p>
      ) : null}
      {summary.pendingApproval.length > 0 ? <p className={styles.muted}>{text('arena.budget.pending', { models: summary.pendingApproval.join(', ') })}</p> : null}
      <p className={styles.muted}>
        {text('arena.budget.checked', {
          gemini: arenaDay(summary.pricesCheckedAt.gemini, lang),
          claude: arenaDay(summary.pricesCheckedAt.claude, lang),
          openai: arenaDay(summary.pricesCheckedAt.openai, lang),
        })}
      </p>
    </GlassSurface>
  )
}
