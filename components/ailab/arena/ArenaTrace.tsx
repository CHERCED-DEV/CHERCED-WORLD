'use client'

import type { ArenaCase, ArenaColumn } from '@/content/ailab/arena/results'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/lib/i18n/config'
import styles from './ArenaStage.module.scss'
import { arenaNumber, arenaText, arenaUsd } from './copy'

export function downloadJson(name: string, value: unknown): void {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  link.download = `${name}.json`
  link.click()
  URL.revokeObjectURL(link.href)
}

export type ArenaTraceProps = { lang: Locale; column: ArenaColumn; entry: ArenaCase; runId: string }

export function ArenaTrace({ lang, column, entry, runId }: ArenaTraceProps) {
  const text = arenaText(lang)
  return (
    <details className={styles.trace} data-cw-arena-trace={column.provider}>
      <summary>{text('arena.trace.title')}</summary>
      <dl className={styles.facts}>
        <div>
          <dt>{text('arena.trace.requested')}</dt>
          <dd>{column.requestedModel}</dd>
        </div>
        <div>
          <dt>{text('arena.trace.served')}</dt>
          <dd>{column.model ?? text('arena.metrics.empty')}</dd>
        </div>
      </dl>
      <p className={styles.label}>{text('arena.trace.attempts')}</p>
      <ol className={styles.attempts}>
        {column.attempts.map((attempt, index) => (
          <li key={index} data-cw-arena-attempt={attempt.outcome}>
            <span>
              {text(`arena.provider.${attempt.provider}`)} · {attempt.model ?? attempt.requestedModel} · {text(`arena.trace.outcome.${attempt.outcome}`)}
            </span>
            <span className={styles.muted}>
              {text('arena.trace.ms', { ms: arenaNumber(attempt.latencyMs, lang) })}
              {attempt.usage ? ` · ${arenaNumber(attempt.usage.inputTokens, lang)} / ${arenaNumber(attempt.usage.outputTokens, lang)}` : ''}
              {` · ${arenaUsd(attempt.costUsd, lang)} USD`}
            </span>
            {attempt.reason ? <span className={styles.muted}>{attempt.reason}</span> : null}
          </li>
        ))}
      </ol>
      <Button variant="ghost" size="sm" onClick={() => downloadJson(`arena-${runId}-${entry.taskId ?? 'libre'}`, { runId, comparison: entry })} data-cw-arena-export={column.provider}>
        {text('arena.trace.export')}
      </Button>
    </details>
  )
}
