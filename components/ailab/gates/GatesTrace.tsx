'use client'

import type { GateRun, GateStep } from '@/lib/ai/gates/schema'
import type { Locale } from '@/lib/i18n/config'
import { gatesCop, gatesNumber, gatesText, gatesUsd, type GatesCopyKey } from './copy'
import { providerName } from './FindingList'
import styles from './GatesStage.module.scss'

export function stepCost(lang: Locale, step: GateStep, rate: number): string {
  const text = gatesText(lang)
  if (step.provider === 'deterministic') return text('gates.metrics.free')
  return text('gates.metrics.cost', { usd: gatesUsd(step.costUsd, lang), cop: gatesCop(step.costUsd, rate, lang) })
}

export type RunLike = Pick<GateRun, 'steps' | 'copRate' | 'simulated'>

export type GatesTraceProps = { lang: Locale; run: RunLike; step: GateStep; index: number }

export function GatesTrace({ lang, run, step, index }: GatesTraceProps) {
  const text = gatesText(lang)
  return (
    <details className={styles.trace} data-cw-gates-trace={index}>
      <summary>{text('gates.trace.title')}</summary>
      <dl className={styles.facts}>
        <div>
          <dt>{text('gates.trace.served')}</dt>
          <dd>{providerName(lang, step.provider)}</dd>
        </div>
        {step.seat ? (
          <div>
            <dt>{text('gates.trace.seat')}</dt>
            <dd>{providerName(lang, step.seat)}</dd>
          </div>
        ) : null}
        <div>
          <dt>{text('gates.metrics.model')}</dt>
          <dd>{step.model ?? text('gates.metrics.empty')}</dd>
        </div>
        <div>
          <dt>{text('gates.metrics.tokens')}</dt>
          <dd>{text('gates.metrics.tokensValue', { input: gatesNumber(step.inputTokens, lang), output: gatesNumber(step.outputTokens, lang) })}</dd>
        </div>
        <div>
          <dt>{text('gates.metrics.latency')}</dt>
          <dd>{text('gates.metrics.ms', { ms: gatesNumber(step.latencyMs, lang, 2) })}</dd>
        </div>
        <div>
          <dt>{text('gates.metrics.costLabel')}</dt>
          <dd>{stepCost(lang, step, run.copRate.value)}</dd>
        </div>
      </dl>
      {step.attempts.length ? (
        <>
          <p className={styles.label}>{text('gates.trace.attempts')}</p>
          <ol className={styles.attempts}>
            {step.attempts.map((attempt, position) => (
              <li key={position} data-cw-gates-attempt={attempt.outcome}>
                <span>
                  {providerName(lang, attempt.provider)} · {attempt.model ?? attempt.requestedModel} · {text(`gates.trace.outcome.${attempt.outcome}` as GatesCopyKey)}
                </span>
                <span className={styles.muted}>
                  {text('gates.metrics.ms', { ms: gatesNumber(attempt.latencyMs, lang) })}
                  {attempt.usage ? ` · ${gatesNumber(attempt.usage.inputTokens, lang)} / ${gatesNumber(attempt.usage.outputTokens, lang)}` : ''}
                  {` · ${gatesUsd(attempt.costUsd, lang)} USD`}
                </span>
                {attempt.reason ? <span className={styles.muted}>{attempt.reason}</span> : null}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className={styles.muted}>{text('gates.trace.none')}</p>
      )}
      {step.reason ? <p className={styles.error}>{text('gates.step.error', { reason: step.reason })}</p> : null}
    </details>
  )
}

export function GatesTotal({ lang, run }: { lang: Locale; run: GateRun }) {
  const text = gatesText(lang)
  const tokens = run.steps.reduce((sum, step) => sum + step.inputTokens + step.outputTokens, 0)
  const ms = run.steps.reduce((sum, step) => sum + step.latencyMs, 0)
  return (
    <p className={styles.total} data-cw-gates-total="">
      {text('gates.total', {
        usd: gatesUsd(run.totalUsd, lang),
        cop: gatesCop(run.totalUsd, run.copRate.value, lang),
        cap: gatesUsd(run.capUsd, lang),
        tokens: gatesNumber(tokens, lang),
        seconds: gatesNumber(ms / 1000, lang, 1),
        steps: run.steps.length,
      })}
    </p>
  )
}
