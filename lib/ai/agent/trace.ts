import { PRICES_CHECKED_AT, PRICES_SOURCE, toCop, USD_TO_COP, USD_TO_COP_DATE, USD_TO_COP_SOURCE } from '@/lib/ai/pricing'
import { mergeUsage, usageCost, type LiveUsage } from './usage'

export const TRACE_VERSION = 1

export const TRACE_MAX_TURNS = 60

export const TRACE_TEXT_MAX = 240

export type TraceSource = 'voice' | 'text' | 'greeting' | 'model'

export type TraceToolResult =
  | { kind: 'search'; hits: Array<{ title: string; url: string; score: number }> }
  | { kind: 'open'; path: string | null }
  | { kind: 'error'; error: string }

export type TraceTool = { name: string; args: Record<string, unknown>; ms: number; result: TraceToolResult }

export type TraceTurnState = 'asked' | 'answering' | 'done'

export type TraceTurn = {
  n: number
  state: TraceTurnState
  source: TraceSource
  heardBy: 'vad' | 'transcript' | 'text' | 'greeting' | null
  question: string
  answer: string
  askedAt: number | null
  firstAudioAt: number | null
  doneAt: number | null
  audioMs: number
  interrupted: boolean
  tools: TraceTool[]
  usage: LiveUsage | null
  costUsd: number
}

export type TraceMode = 'live' | 'local'

export type Trace = { mode: TraceMode; model: string; voice: string; startedAt: number; turns: TraceTurn[] }

export type TraceSummary = {
  turns: number
  latencyP50: number | null
  latencyP95: number | null
  tokens: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  costCop: number
  tools: number
}

export function createTrace(mode: TraceMode, model: string, voice: string, startedAt: number): Trace {
  return { mode, model, voice, startedAt, turns: [] }
}

function clip(text: string): string {
  return text.length > TRACE_TEXT_MAX ? `${text.slice(0, TRACE_TEXT_MAX - 1)}…` : text
}

function join(previous: string, chunk: string): string {
  const next = chunk.trim()
  if (!next) return previous
  if (!previous) return clip(next)
  return clip(/^[,.;:!?)]/.test(next) ? `${previous}${next}` : `${previous} ${next}`)
}

function newTurn(trace: Trace, source: TraceSource, state: TraceTurnState): TraceTurn {
  const last = trace.turns.at(-1)
  return {
    n: (last?.n ?? 0) + 1,
    state,
    source,
    heardBy: null,
    question: '',
    answer: '',
    askedAt: null,
    firstAudioAt: null,
    doneAt: null,
    audioMs: 0,
    interrupted: false,
    tools: [],
    usage: null,
    costUsd: 0,
  }
}

function withTurn(trace: Trace, index: number, turn: TraceTurn): Trace {
  const turns = [...trace.turns]
  turns[index] = turn
  return { ...trace, turns }
}

function pushTurn(trace: Trace, turn: TraceTurn): { trace: Trace; index: number } {
  const turns = [...trace.turns, turn].slice(-TRACE_MAX_TURNS)
  return { trace: { ...trace, turns }, index: turns.length - 1 }
}

function findLast(trace: Trace, state: TraceTurnState): number {
  for (let index = trace.turns.length - 1; index >= 0; index--) if (trace.turns[index]!.state === state) return index
  return -1
}

function findFirst(trace: Trace, state: TraceTurnState): number {
  return trace.turns.findIndex((turn) => turn.state === state)
}

function findNumber(trace: Trace, n: number): number {
  return trace.turns.findIndex((turn) => turn.n === n && turn.state !== 'done')
}

function promote(trace: Trace, index: number): { trace: Trace; index: number } {
  const turn = trace.turns[index]!
  return turn.state === 'asked' ? { trace: withTurn(trace, index, { ...turn, state: 'answering' }), index } : { trace, index }
}

function answering(trace: Trace, n?: number): { trace: Trace; index: number } {
  if (n !== undefined) {
    const own = findNumber(trace, n)
    if (own >= 0) return promote(trace, own)
  }
  const current = findLast(trace, 'answering')
  if (current >= 0) return { trace, index: current }
  const waiting = findFirst(trace, 'asked')
  if (waiting >= 0) return promote(trace, waiting)
  return pushTurn(trace, newTurn(trace, 'model', 'answering'))
}

export function pendingTurn(trace: Trace | null): number | undefined {
  if (!trace) return undefined
  const index = findLast(trace, 'asked')
  return index >= 0 ? trace.turns[index]!.n : undefined
}

export function markAsked(trace: Trace, at: number, source: 'voice' | 'text' | 'greeting', heardBy: 'vad' | 'text' | 'greeting', text = ''): Trace {
  const waiting = findLast(trace, 'asked')
  if (waiting >= 0) {
    const turn = trace.turns[waiting]!
    return withTurn(trace, waiting, { ...turn, source, heardBy, askedAt: at, question: text ? join(turn.question, text) : turn.question })
  }
  const turn = { ...newTurn(trace, source, 'asked'), heardBy, askedAt: at, question: clip(text.trim()) }
  return pushTurn(trace, turn).trace
}

export function markHeard(trace: Trace, at: number, text: string): Trace {
  if (!text.trim()) return trace
  const waiting = findLast(trace, 'asked')
  if (waiting >= 0) {
    const turn = trace.turns[waiting]!
    const askedAt = turn.heardBy === 'vad' || turn.heardBy === 'text' ? turn.askedAt : at
    return withTurn(trace, waiting, { ...turn, source: 'voice', heardBy: turn.heardBy ?? 'transcript', askedAt, question: join(turn.question, text) })
  }
  const current = findLast(trace, 'answering')
  if (current >= 0 && trace.turns[current]!.source === 'voice') {
    const turn = trace.turns[current]!
    return withTurn(trace, current, { ...turn, question: join(turn.question, text) })
  }
  const turn = { ...newTurn(trace, 'voice', 'asked'), heardBy: 'transcript' as const, askedAt: at, question: clip(text.trim()) }
  return pushTurn(trace, turn).trace
}

export function markAudio(trace: Trace, at: number, n?: number): Trace {
  const current = n === undefined ? findLast(trace, 'answering') : findNumber(trace, n)
  if (current >= 0 && trace.turns[current]!.firstAudioAt !== null) return trace
  const open = answering(trace, n)
  const turn = open.trace.turns[open.index]!
  if (turn.firstAudioAt !== null) return open.trace
  return withTurn(open.trace, open.index, { ...turn, firstAudioAt: at })
}

export function markAnswer(trace: Trace, text: string, n?: number): Trace {
  if (!text.trim()) return trace
  const open = answering(trace, n)
  const turn = open.trace.turns[open.index]!
  return withTurn(open.trace, open.index, { ...turn, answer: join(turn.answer, text) })
}

export function addTool(trace: Trace, tool: TraceTool, n?: number): Trace {
  const open = answering(trace, n)
  const turn = open.trace.turns[open.index]!
  return withTurn(open.trace, open.index, { ...turn, tools: [...turn.tools, tool] })
}

export function markUsage(trace: Trace, usage: LiveUsage): Trace {
  let index = findFirst(trace, 'answering')
  if (index < 0) index = findFirst(trace, 'asked')
  if (index < 0) index = trace.turns.length - 1
  if (index < 0) return trace
  const turn = trace.turns[index]!
  const merged = mergeUsage(turn.usage, usage)
  return withTurn(trace, index, { ...turn, usage: merged, costUsd: usageCost(trace.model, merged) })
}

export function markInterrupted(trace: Trace): Trace {
  const index = findFirst(trace, 'answering')
  if (index < 0 || trace.turns[index]!.interrupted) return trace
  return withTurn(trace, index, { ...trace.turns[index]!, interrupted: true })
}

export function closeTurn(trace: Trace, at: number, audioMs = 0, n?: number): Trace {
  const index = n === undefined ? findFirst(trace, 'answering') : findNumber(trace, n)
  if (index < 0 || trace.turns[index]!.state !== 'answering') return trace
  const turn = trace.turns[index]!
  return withTurn(trace, index, { ...turn, state: 'done', doneAt: at, audioMs: turn.audioMs + Math.max(0, Math.round(audioMs)) })
}

export function turnLatency(turn: TraceTurn): number | null {
  if (turn.askedAt === null || turn.firstAudioAt === null) return null
  return Math.max(0, turn.firstAudioAt - turn.askedAt)
}

export function turnDuration(turn: TraceTurn): number | null {
  const start = turn.askedAt ?? turn.firstAudioAt
  if (start === null || turn.doneAt === null) return null
  return Math.max(0, turn.doneAt - start)
}

export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length)
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1]!
}

export function summarize(trace: Trace): TraceSummary {
  const answered = trace.turns.filter((turn) => turn.state !== 'asked')
  const latencies = answered.map(turnLatency).filter((value): value is number => value !== null)
  let tokens = 0
  let inputTokens = 0
  let outputTokens = 0
  let costUsd = 0
  let tools = 0
  for (const turn of trace.turns) {
    tools += turn.tools.length
    costUsd += turn.costUsd
    if (!turn.usage) continue
    tokens += turn.usage.total
    inputTokens += turn.usage.input.text + turn.usage.input.audio + turn.usage.input.image
    outputTokens += turn.usage.output.text + turn.usage.output.audio + turn.usage.output.image
  }
  return {
    turns: answered.length,
    latencyP50: percentile(latencies, 50),
    latencyP95: percentile(latencies, 95),
    tokens,
    inputTokens,
    outputTokens,
    costUsd,
    costCop: toCop(costUsd),
    tools,
  }
}

function iso(at: number | null): string | null {
  return at === null ? null : new Date(at).toISOString()
}

export function traceExport(trace: Trace, exportedAt: number) {
  return {
    version: TRACE_VERSION,
    exportedAt: iso(exportedAt),
    mode: trace.mode,
    model: trace.model,
    voice: trace.voice,
    startedAt: iso(trace.startedAt),
    prices: {
      checkedAt: PRICES_CHECKED_AT,
      source: PRICES_SOURCE,
      usdToCop: USD_TO_COP,
      usdToCopDate: USD_TO_COP_DATE,
      usdToCopSource: USD_TO_COP_SOURCE,
    },
    summary: summarize(trace),
    turns: trace.turns.map((turn) => ({
      n: turn.n,
      source: turn.source,
      question: turn.question,
      answer: turn.answer,
      askedAt: iso(turn.askedAt),
      heardBy: turn.heardBy,
      latencyMs: turnLatency(turn),
      durationMs: turnDuration(turn),
      audioMs: turn.audioMs,
      interrupted: turn.interrupted,
      tools: turn.tools,
      usage: turn.usage,
      costUsd: turn.costUsd,
    })),
  }
}
