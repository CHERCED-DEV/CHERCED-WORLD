import type { GateRun, GateStep } from '@/lib/ai/gates/schema'
import type { GateEvent } from '@/lib/ai/gates/view'

export const GATES_ENDPOINT = '/api/ailab/gates'

export const GATES_CHANGES_ENDPOINT = '/api/ailab/gates/changes'

export const GATES_ERRORS = [
  'account',
  'consent',
  'rate_limited',
  'daily_cap',
  'budget',
  'off',
  'too_long',
  'too_short',
  'too_expensive',
  'invalid',
  'failed',
  'writer',
  'stream',
  'run_cap',
  'already',
  'expired',
  'invalid_run',
  'not_allowed',
] as const

export type GatesError = (typeof GATES_ERRORS)[number]

export function gatesErrorKey(value: unknown): GatesError {
  return typeof value === 'string' && (GATES_ERRORS as readonly string[]).includes(value) ? (value as GatesError) : 'failed'
}

export type GatesStreamResult = { run: GateRun } | { error: GatesError; steps: GateStep[] }

export function parseLines(buffer: string): { events: GateEvent[]; rest: string } {
  const lines = buffer.split('\n')
  const rest = lines.pop() ?? ''
  const events: GateEvent[] = []
  for (const line of lines) {
    if (!line.trim()) continue
    try {
      events.push(JSON.parse(line) as GateEvent)
    } catch {}
  }
  return { events, rest }
}

export async function postGate(url: string, body: unknown, onStep: (step: GateStep) => void): Promise<GatesStreamResult> {
  const steps: GateStep[] = []
  let response: Response
  try {
    response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    return { error: 'failed', steps }
  }
  if (!response.ok || !response.body) {
    const payload = (await response.json().catch(() => null)) as { error?: unknown } | null
    return { error: gatesErrorKey(payload?.error), steps }
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    for (;;) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      const parsed = parseLines(done ? `${buffer}\n` : buffer)
      buffer = parsed.rest
      for (const event of parsed.events) {
        if (event.type === 'step') {
          steps.push(event.step)
          onStep(event.step)
        } else if (event.type === 'done') return { run: event.run }
        else if (event.type === 'error') return { error: gatesErrorKey(event.error), steps }
      }
      if (done) break
    }
  } catch {
    return { error: 'stream', steps }
  }
  return { error: 'stream', steps }
}
