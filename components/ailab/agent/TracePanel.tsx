'use client'

import { useId, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { AgentTraceCopy } from '@/content/ailab/agent'
import type { Locale } from '@/lib/i18n/config'
import { PRICES_CHECKED_AT, PRICES_SOURCE, USD_TO_COP, USD_TO_COP_DATE } from '@/lib/ai/pricing'
import { summarize, traceExport, turnDuration, turnLatency, type Trace, type TraceTool, type TraceTurn } from '@/lib/ai/agent/trace'
import type { TokenSplit } from '@/lib/ai/agent/usage'
import { downloadText } from '@/lib/ailab/skill/download'
import styles from './Agent.module.scss'

type Props = { trace: Trace; copy: AgentTraceCopy; lang: Locale }

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
}

function formats(lang: Locale) {
  const locale = lang === 'es' ? 'es-CO' : 'en-US'
  const integer = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const seconds = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const tiny = new Intl.NumberFormat(locale, { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  const small = new Intl.NumberFormat(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
  const cop = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const score = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return {
    count: (value: number) => integer.format(value),
    score: (value: number) => score.format(value),
    time: (ms: number | null) => (ms === null ? '—' : ms < 1000 ? `${integer.format(ms)} ms` : `${seconds.format(ms / 1000)} s`),
    usd: (value: number) => `${(value < 0.01 ? tiny : small).format(value)} USD`,
    cop: (value: number) => `${cop.format(value)} COP`,
    rate: (value: number) => integer.format(value),
  }
}

function splitText(split: TokenSplit, copy: AgentTraceCopy, count: (value: number) => string): string {
  return fill(copy.textAudio, { text: count(split.text + split.image), audio: count(split.audio) })
}

function toolLine(tool: TraceTool, copy: AgentTraceCopy, count: (value: number) => string): string {
  const arg = Object.values(tool.args).find((value) => typeof value === 'string') as string | undefined
  const call = `${tool.name}(${arg ? JSON.stringify(arg) : ''})`
  if (tool.result.kind === 'search') return `${call} → ${fill(copy.results, { count: count(tool.result.hits.length) })}`
  if (tool.result.kind === 'open') return `${call} → ${tool.result.path ? fill(copy.opened, { path: tool.result.path }) : copy.refused}`
  return `${call} → ${fill(copy.failed, { error: tool.result.error })}`
}

function stamp(at: number): string {
  const date = new Date(at)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

function TurnItem({ turn, copy, format, live }: { turn: TraceTurn; copy: AgentTraceCopy; format: ReturnType<typeof formats>; live: boolean }) {
  const latency = turnLatency(turn)
  const duration = turnDuration(turn)
  const timing = [
    latency !== null ? fill(copy.latency, { time: format.time(latency) }) : null,
    duration !== null ? fill(copy.duration, { time: format.time(duration) }) : null,
    turn.audioMs > 0 ? fill(copy.spoke, { time: format.time(turn.audioMs) }) : null,
  ].filter(Boolean)
  return (
    <li className={styles.traceTurn} data-state={turn.state} data-cw-agent-trace-turn="">
      <p className={styles.traceTurnHead}>
        <span className={styles.who}>{fill(copy.turn, { n: turn.n })}</span>
        <span>{copy.sources[turn.source]}</span>
        {turn.interrupted ? <span className={styles.traceFlag}>{copy.interrupted}</span> : null}
      </p>
      {turn.question ? (
        <p className={styles.traceText}>
          <span className={styles.traceKey}>{copy.question}:</span> {turn.question}
        </p>
      ) : null}
      <p className={styles.traceText} data-cw-agent-trace-timing="">
        {turn.state === 'done' ? timing.join(' · ') || '—' : copy.pending}
      </p>
      {turn.tools.length ? (
        <ul className={styles.traceTools}>
          {turn.tools.map((tool, index) => (
            <li key={index}>
              <code>{toolLine(tool, copy, format.count)}</code>
              <span className={styles.traceMs}> {format.time(tool.ms)}</span>
              {tool.result.kind === 'search' && tool.result.hits.length ? (
                <ol className={styles.traceHits}>
                  {tool.result.hits.map((hit) => (
                    <li key={hit.url}>
                      <a href={hit.url}>{hit.title}</a> <span className={styles.traceMs}>{format.score(hit.score)}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ul>
      ) : turn.state === 'done' ? (
        <p className={styles.traceText}>{copy.noTools}</p>
      ) : null}
      {turn.usage ? (
        <p className={styles.traceText} data-cw-agent-trace-usage="">
          {fill(copy.tokensIn, { total: format.count(turn.usage.prompt + turn.usage.toolPrompt), detail: splitText(turn.usage.input, copy, format.count) })}
          {' · '}
          {fill(copy.tokensOut, {
            total: format.count(turn.usage.response + turn.usage.thoughts),
            detail: splitText(turn.usage.output, copy, format.count),
          })}
          {' · '}
          <strong>
            {format.usd(turn.costUsd)} ({format.cop(turn.costUsd * USD_TO_COP)})
          </strong>
        </p>
      ) : turn.state === 'done' && !live ? (
        <p className={styles.traceText}>{copy.noUsage}</p>
      ) : null}
    </li>
  )
}

export function TracePanel({ trace, copy, lang }: Props) {
  const [open, setOpen] = useState(false)
  const regionId = useId()
  const format = useMemo(() => formats(lang), [lang])
  const summary = useMemo(() => summarize(trace), [trace])
  const live = trace.mode === 'live'
  const model = live ? `${trace.model} · ${trace.voice}` : copy.simulator

  const exportTrace = () => {
    const now = Date.now()
    downloadText(`mini-cherced-traza-${stamp(now)}.json`, `${JSON.stringify(traceExport(trace, now), null, 2)}\n`, 'application/json;charset=utf-8')
  }

  return (
    <div className={styles.trace} data-cw-agent-trace="">
      <div className={styles.row}>
        <Button
          variant="ghost"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((value) => !value)}
          data-cw-agent-trace-toggle=""
        >
          {fill(copy.toggle, { count: format.count(summary.turns) })}
        </Button>
      </div>
      <div id={regionId} className={styles.traceBody} hidden={!open} role="region" aria-label={copy.title}>
        <p className={styles.traceTitle}>{copy.title}</p>
        <p className={styles.note}>{copy.intro}</p>
        <dl className={styles.traceSummary} data-cw-agent-trace-summary="">
          <div>
            <dt>{copy.summary.turns}</dt>
            <dd>{format.count(summary.turns)}</dd>
          </div>
          <div>
            <dt>{copy.summary.p50}</dt>
            <dd>{format.time(summary.latencyP50)}</dd>
          </div>
          <div>
            <dt>{copy.summary.p95}</dt>
            <dd>{format.time(summary.latencyP95)}</dd>
          </div>
          <div>
            <dt>{copy.summary.tools}</dt>
            <dd>{format.count(summary.tools)}</dd>
          </div>
          <div>
            <dt>{copy.summary.tokens}</dt>
            <dd>{format.count(summary.tokens)}</dd>
          </div>
          <div>
            <dt>{copy.summary.cost}</dt>
            <dd>
              {format.usd(summary.costUsd)}
              <br />
              {format.cop(summary.costCop)}
            </dd>
          </div>
          <div className={styles.traceWide}>
            <dt>{copy.summary.model}</dt>
            <dd>{model}</dd>
          </div>
        </dl>
        {trace.turns.length ? (
          <ol className={styles.traceTurns} data-cw-agent-trace-turns="">
            {trace.turns.map((turn) => (
              <TurnItem key={turn.n} turn={turn} copy={copy} format={format} live={live} />
            ))}
          </ol>
        ) : (
          <p className={styles.note}>{copy.empty}</p>
        )}
        <p className={styles.note}>
          {fill(copy.prices, { date: PRICES_CHECKED_AT, rate: format.rate(USD_TO_COP), rateDate: USD_TO_COP_DATE })}{' '}
          <a href={PRICES_SOURCE} target="_blank" rel="noopener noreferrer">
            {copy.pricesLink}
          </a>
        </p>
        <div className={styles.row}>
          <Button variant="glass" onClick={exportTrace} disabled={!trace.turns.length} data-cw-agent-trace-export="">
            {copy.export}
          </Button>
        </div>
      </div>
    </div>
  )
}
