import 'server-only'
import * as cotejo from 'cotejo-core'
import { getAccountState } from '@/lib/auth/accounts'
import { PRIVATE } from '@/lib/ai/lab/route'
import { assertMonthlyBudget, availableProviders, generateJson, providersMode } from '@/lib/ai/providers/port'
import { logServerError } from '@/lib/security/log'
import { GateError, type GateDeps } from './run'
import type { GateRun } from './schema'
import { GATE_STREAM_TYPE, type GateEvent } from './view'

export const GATE_DEADLINE_MS = 50_000

export type GateAccount = { id: string } | null | 'unavailable'

export async function gateAccount(scope: string): Promise<GateAccount> {
  try {
    const state = await getAccountState()
    return state ? { id: state.account.id } : null
  } catch (error) {
    logServerError(scope, error)
    return 'unavailable'
  }
}

export function liveDeps(emit: (event: GateEvent) => void): GateDeps {
  return {
    port: { generateJson, availableProviders, providersMode, assertMonthlyBudget },
    core: cotejo,
    onStep: (step) => emit({ type: 'step', step }),
    onNote: (note) => emit({ type: 'note', note }),
    deadlineAt: performance.now() + GATE_DEADLINE_MS,
  }
}

export function gateErrorCode(error: unknown): string {
  if (error instanceof GateError) {
    if (error.code === 'budget') return 'budget'
    if (error.code === 'writer') return 'writer'
    if (error.code === 'invalid_run') return 'invalid_run'
    return 'off'
  }
  return 'failed'
}

export function streamGate(scope: string, work: (emit: (event: GateEvent) => void) => Promise<GateRun>, seal: (run: GateRun) => GateRun): Response {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: GateEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      try {
        const run = await work(emit)
        emit({ type: 'done', run: seal(run) })
      } catch (error) {
        if (!(error instanceof GateError) || error.code !== 'writer') logServerError(scope, error)
        emit({ type: 'error', error: gateErrorCode(error) })
      } finally {
        controller.close()
      }
    },
  })
  return new Response(body, { status: 200, headers: { ...PRIVATE, 'content-type': GATE_STREAM_TYPE } })
}
