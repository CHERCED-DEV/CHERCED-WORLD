import * as cotejo from 'cotejo-core'
import type { PaidProviderId } from '@/lib/ai/providers/types'
import type { GateDeps, GatePort } from '@/lib/ai/gates/run'
import type { GateStep } from '@/lib/ai/gates/schema'
import { testPort, type TestPort } from '../providers/support'
import { gatesAdapter, type GatesCall, type GatesScript } from './fake-adapter'

export { CLEAN_WRITER, gatesAdapter, idsIn, review, roleOf, verdicts, type GatesCall, type GatesReply, type GatesRole, type GatesScript } from './fake-adapter'

export function gatesPort(providers: readonly PaidProviderId[], script: GatesScript = {}, calls: GatesCall[] = []): TestPort {
  const adapters = Object.fromEntries(providers.map((provider) => [provider, gatesAdapter(provider, calls, script)]))
  return testPort({ adapters })
}

export function localPort(): TestPort {
  return testPort({ adapters: {}, keys: {}, mode: 'local' })
}

export function gateDeps(port: GatePort, steps: GateStep[] = [], extra: Partial<GateDeps> = {}): GateDeps {
  return { port, core: cotejo, onStep: (step) => steps.push(step), now: () => new Date('2026-11-28T12:00:00.000Z'), ...extra }
}
