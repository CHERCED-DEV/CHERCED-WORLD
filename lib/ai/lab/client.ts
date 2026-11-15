import { summarize, type Trace } from '@/lib/ai/agent/trace'
import type { Turn } from '@/lib/ai/agent/transcript'

export const LAB_SESSIONS_ENDPOINT = '/api/ailab/sessions'

export type LabEndReason = 'hangup' | 'expired' | 'error' | 'left'

export type LabSavePayload = {
  lang: 'es' | 'en'
  mode: 'live' | 'local'
  interview: string | null
  startedAt: number
  endedAt: number
  endReason: LabEndReason
  turns: Array<{ who: 'you' | 'agent'; text: string }>
  trace: { turns: number; latencyP50: number | null; latencyP95: number | null; tokens: number; costUsd: number; tools: string[] } | null
}

export function labPayload(input: {
  lang: 'es' | 'en'
  mode: 'live' | 'local'
  interview: string | null
  startedAt: number
  endedAt: number
  endReason: LabEndReason
  turns: readonly Turn[]
  trace: Trace | null
}): LabSavePayload | null {
  const turns = input.turns
    .map((turn) => ({ who: turn.who, text: turn.text.trim().slice(0, 600) }))
    .filter((turn) => turn.text)
    .slice(-40)
  if (!turns.some((turn) => turn.who === 'you')) return null
  const summary = input.trace ? summarize(input.trace) : null
  return {
    lang: input.lang,
    mode: input.mode,
    interview: input.interview,
    startedAt: Math.round(input.startedAt),
    endedAt: Math.round(input.endedAt),
    endReason: input.endReason,
    turns,
    trace:
      input.trace && summary
        ? {
            turns: summary.turns,
            latencyP50: summary.latencyP50,
            latencyP95: summary.latencyP95,
            tokens: summary.tokens,
            costUsd: Number(summary.costUsd.toFixed(6)),
            tools: input.trace.turns.flatMap((turn) => turn.tools.map((tool) => tool.name)).slice(0, 60),
          }
        : null,
  }
}

export function sendLabSession(payload: LabSavePayload): void {
  void fetch(LAB_SESSIONS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
