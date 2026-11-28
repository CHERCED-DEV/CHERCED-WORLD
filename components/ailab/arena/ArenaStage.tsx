'use client'

import { useId, useMemo, useState } from 'react'
import { ProviderBadge } from '@/components/ai/providers/ProviderBadge'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import results from '@/content/ailab/arena/results.json'
import type { ArenaCase, ArenaColumn, ArenaResults, ArenaRun } from '@/content/ailab/arena/results'
import { arenaTask, arenaTasksFor } from '@/content/ailab/arena/tasks'
import { bestColumn, caseCostUsd, latestRun } from '@/content/ailab/arena/view'
import type { Locale } from '@/lib/i18n/config'
import { ArenaLive } from './ArenaLive'
import { ArenaTrace, downloadJson } from './ArenaTrace'
import styles from './ArenaStage.module.scss'
import { arenaCop, arenaDate, arenaDay, arenaNumber, arenaText, arenaUsd, type ArenaText } from './copy'

export const PREGENERATED: ArenaRun | null = latestRun(results as unknown as ArenaResults)

function answerText(column: ArenaColumn): string {
  const data = column.data
  if (data && typeof data === 'object' && 'answer' in data && typeof (data as { answer: unknown }).answer === 'string' && Object.keys(data).length === 1) return (data as { answer: string }).answer
  return JSON.stringify(data, null, 2)
}

function rulesText(column: ArenaColumn, text: ArenaText): string {
  if (column.status !== 'ok') return text('arena.metrics.empty')
  if (!column.rules) return text('arena.rules.none')
  return column.rules.pass ? text('arena.rules.pass') : text('arena.rules.fail', { reasons: column.rules.reasons.join('; ') })
}

function judgeText(column: ArenaColumn, text: ArenaText): string {
  if (column.status !== 'ok') return text('arena.metrics.empty')
  if (column.judge) return text('arena.judge.score', { score: column.judge.score, judge: `${text(`arena.provider.${column.judge.provider}`)} (${column.judge.model})` })
  return column.judgeError?.startsWith('sin juez') ? text('arena.judge.none') : text('arena.judge.failed')
}

function costText(usd: number, lang: Locale, rate: number, text: ArenaText): string {
  return text('arena.cost', { usd: arenaUsd(usd, lang), cop: arenaCop(usd, lang, rate) })
}

type CaseViewProps = { lang: Locale; entry: ArenaCase; run: ArenaRun; input: { instruction: string; input: string } | null }

export function ArenaCaseView({ lang, entry, run, input }: CaseViewProps) {
  const text = arenaText(lang)
  const best = bestColumn(entry)
  const baseId = useId()
  const rows: Array<{ key: string; label: string; cell: (column: ArenaColumn) => string }> = [
    { key: 'model', label: text('arena.metrics.model'), cell: (column) => (column.status === 'ok' ? (column.model ?? text('arena.metrics.empty')) : text('arena.metrics.empty')) },
    { key: 'latency', label: text('arena.metrics.latency'), cell: (column) => (column.status === 'ok' ? text('arena.trace.ms', { ms: arenaNumber(column.latencyMs, lang) }) : text('arena.metrics.empty')) },
    {
      key: 'tokens',
      label: text('arena.metrics.tokens'),
      cell: (column) => (column.usage ? `${arenaNumber(column.usage.inputTokens, lang)} / ${arenaNumber(column.usage.outputTokens, lang)}` : text('arena.metrics.empty')),
    },
    { key: 'cost', label: text('arena.metrics.cost'), cell: (column) => costText(column.costUsd + (column.judge?.costUsd ?? 0), lang, run.copRate.value, text) },
    { key: 'rules', label: text('arena.metrics.rules'), cell: (column) => rulesText(column, text) },
    { key: 'judge', label: text('arena.metrics.judge'), cell: (column) => judgeText(column, text) },
  ]
  return (
    <div className={styles.case} data-cw-arena-case={entry.taskId ?? 'libre'}>
      {input ? (
        <details className={styles.input}>
          <summary>{text('arena.task.input')}</summary>
          <p className={styles.muted}>{input.instruction}</p>
          <pre className={styles.pre}>{input.input}</pre>
        </details>
      ) : null}
      {entry.kind === null ? <p className={styles.note}>{text('arena.live.freeNote')}</p> : null}
      <ul className={styles.columns} aria-label={text('arena.columns.label')}>
        {entry.columns.map((column) => {
          const titleId = `${baseId}-${column.provider}`
          const injectionFailed = entry.kind === 'injection' && column.status === 'ok' && column.rules && !column.rules.pass
          return (
            <li key={column.provider} className={styles.column} data-cw-arena-column={column.provider} data-status={column.status}>
              <article aria-labelledby={titleId}>
                <h5 id={titleId} className={styles.columnTitle}>
                  <ProviderBadge provider={column.provider} label={text(`arena.provider.${column.provider}`)} detail={text(`arena.provider.company.${column.provider}`)} />
                </h5>
                {column.provider === best ? (
                  <p className={styles.best} data-cw-arena-best="">
                    <span aria-hidden="true">★ </span>
                    {text('arena.column.best')}
                  </p>
                ) : null}
                {column.servedBy === 'simulator' ? <ProviderBadge provider="simulator" label={text('arena.provider.simulator')} className={styles.simulator} /> : null}
                {column.status === 'inactive' ? <p className={styles.inactive}>{text('arena.column.inactive')}</p> : null}
                {column.status === 'error' ? <p className={styles.error}>{text('arena.column.failed', { reason: column.reason ?? text('arena.metrics.empty') })}</p> : null}
                {column.status === 'ok' ? (
                  <>
                    <p className={styles.label}>{text('arena.column.answer')}</p>
                    <pre className={styles.pre} tabIndex={0} aria-label={`${text('arena.column.answer')}: ${text(`arena.provider.${column.provider}`)}`}>
                      {answerText(column)}
                    </pre>
                    {column.truncated ? <p className={styles.muted}>{text('arena.column.truncated')}</p> : null}
                    {injectionFailed ? (
                      <p className={styles.alarm} role="note" data-cw-arena-injection="">
                        <span aria-hidden="true">⚠ </span>
                        {text('arena.injection.warn')}
                      </p>
                    ) : null}
                    {column.judge ? (
                      <p className={styles.muted}>
                        <strong>{text('arena.judge.reason')}:</strong> {column.judge.reason}
                      </p>
                    ) : null}
                  </>
                ) : null}
                <ArenaTrace lang={lang} column={column} entry={entry} runId={run.id} />
              </article>
            </li>
          )
        })}
      </ul>
      <div className={styles.tableWrap} role="region" aria-labelledby={`${baseId}-caption`} tabIndex={0}>
        <table className={styles.table}>
          <caption id={`${baseId}-caption`}>{text('arena.metrics.caption')}</caption>
          <thead>
            <tr>
              <th scope="col">{text('arena.metrics.metric')}</th>
              {entry.columns.map((column) => (
                <th scope="col" key={column.provider}>
                  {text(`arena.provider.${column.provider}`)}
                  {column.provider === best ? <span className={styles.star}> ★</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} data-cw-arena-metric={row.key}>
                <th scope="row">{row.label}</th>
                {entry.columns.map((column) => (
                  <td key={column.provider}>{row.cell(column)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.muted} data-cw-arena-total="">
        {text('arena.run.total', { usd: arenaUsd(caseCostUsd(entry), lang), cop: arenaCop(caseCostUsd(entry), lang, run.copRate.value), date: arenaDay(run.pricesCheckedAt.claude, lang) })}
      </p>
    </div>
  )
}

export function ArenaView({ lang, pregenerated }: { lang: Locale; pregenerated: ArenaRun | null }) {
  const text = arenaText(lang)
  const tasks = useMemo(() => arenaTasksFor(lang), [lang])
  const [taskId, setTaskId] = useState(tasks[0]!.id)
  const [live, setLive] = useState<{ run: ArenaRun; free: string | null } | null>(null)
  const groupId = useId()
  const run = live?.run ?? pregenerated
  const entry = live ? (live.run.cases[0] ?? null) : (pregenerated?.cases.find((item) => item.taskId === taskId) ?? null)
  const fixed = entry?.taskId ? arenaTask(entry.taskId) : null
  const input = live?.free ? { instruction: text('arena.task.free'), input: live.free } : fixed ? { instruction: fixed.instruction, input: fixed.input } : null
  return (
    <div className={styles.stage} data-cw-arena="">
      <p className={styles.note} data-cw-arena-benchmark="">
        {text('arena.notBenchmark')}
      </p>
      {run ? (
        <p className={styles.date} data-cw-arena-run={run.mode}>
          {text('arena.run.date', { mode: text(`arena.run.mode.${run.mode}`), date: arenaDate(run.at, lang) })}
        </p>
      ) : (
        <p className={styles.note} data-cw-arena-empty="">
          {text('arena.run.none')}
        </p>
      )}
      {run?.simulated ? <p className={styles.note}>{text('arena.run.simulated')}</p> : null}
      {live ? (
        <div className={styles.row}>
          <p className={styles.label}>{text('arena.live.result')}</p>
          <Button variant="ghost" size="sm" onClick={() => setLive(null)} data-cw-arena-back="">
            {text('arena.live.back')}
          </Button>
        </div>
      ) : (
        <fieldset className={styles.tasks}>
          <legend className={styles.label}>{text('arena.task.label')}</legend>
          {tasks.map((task) => (
            <label key={task.id} className={styles.task}>
              <input type="radio" name={`${groupId}-task`} value={task.id} checked={task.id === taskId} onChange={() => setTaskId(task.id)} data-cw-arena-task={task.id} />
              <span>{text(`arena.task.kind.${task.kind}`)}</span>
            </label>
          ))}
        </fieldset>
      )}
      {run && entry ? <ArenaCaseView lang={lang} entry={entry} run={run} input={input} /> : null}
      {run && !live ? (
        <Button variant="ghost" size="sm" onClick={() => downloadJson(`arena-${run.id}`, run)} data-cw-arena-download="">
          {text('arena.run.json')}
        </Button>
      ) : null}
      <ArenaLive lang={lang} taskId={taskId} onResult={(next, free) => setLive({ run: next, free })} />
    </div>
  )
}

export default function ArenaStage({ lang }: LabDemoProps) {
  return <ArenaView lang={lang} pregenerated={PREGENERATED} />
}
