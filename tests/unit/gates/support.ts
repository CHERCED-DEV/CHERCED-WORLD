import * as cotejo from 'cotejo-core'
import type { ProviderAdapter, JsonRequest } from '@/lib/ai/providers/adapter'
import { costUsd } from '@/lib/ai/providers/cost'
import { ProviderCallError, type FailureKind } from '@/lib/ai/providers/errors'
import type { PaidProviderId, TokenUsage } from '@/lib/ai/providers/types'
import type { GateDeps, GatePort } from '@/lib/ai/gates/run'
import type { GateStep, ReviewReplyWire, VerifierReplyWire, WriterReplyWire } from '@/lib/ai/gates/schema'
import { testPort, type TestPort } from '../providers/support'
import { SPEC } from './fixtures'

export type GatesRole = 'writer' | 'reviewer' | 'verifier'

export type GatesCall = { provider: PaidProviderId; role: GatesRole; model: string; system: string; prompt: string; correction: boolean; round2: boolean }

export type GatesReply = { data: unknown; usage?: TokenUsage } | { raw: string; usage?: TokenUsage } | { fail: FailureKind }

export type GatesScript = {
  writer?: (call: GatesCall, index: number) => GatesReply
  reviewer?: (call: GatesCall, index: number) => GatesReply
  verifier?: (call: GatesCall, index: number) => GatesReply
}

export function roleOf(system: string): GatesRole {
  if (system.startsWith('Eres el redactor')) return 'writer'
  if (system.startsWith('Eres un revisor')) return 'reviewer'
  if (system.startsWith('Eres el verificador')) return 'verifier'
  throw new Error(`instrucción desconocida: ${system.slice(0, 40)}`)
}

export function idsIn(prompt: string): string[] {
  const block = /<hallazgos>\n([\s\S]*?)\n<\/hallazgos>/.exec(prompt)?.[1] ?? ''
  return [...block.matchAll(/^(H-\d+) /gm)].map((match) => match[1]!)
}

export const CLEAN_WRITER: WriterReplyWire = { kind: 'funcionalidad', spec: SPEC }

export function review(findings: ReviewReplyWire['findings'], resolved: string[] = []): GatesReply {
  return { data: { findings, resolved } satisfies ReviewReplyWire }
}

export function verdicts(prompt: string, result: VerifierReplyWire['verdicts'][number]['result'] = 'se-sostiene', reason = 'Lo intenté tumbar y no pude.'): GatesReply {
  return { data: { verdicts: idsIn(prompt).map((id) => ({ id, result, reason })) } satisfies VerifierReplyWire }
}

const DEFAULT_USAGE: Record<GatesRole, TokenUsage> = {
  writer: { inputTokens: 1800, outputTokens: 1500 },
  reviewer: { inputTokens: 2800, outputTokens: 700 },
  verifier: { inputTokens: 1500, outputTokens: 300 },
}

export function gatesAdapter(provider: PaidProviderId, calls: GatesCall[], script: GatesScript): ProviderAdapter {
  const counts: Record<GatesRole, number> = { writer: 0, reviewer: 0, verifier: 0 }
  return {
    id: provider,
    async json(request: JsonRequest) {
      const role = roleOf(request.system)
      const entry: GatesCall = {
        provider,
        role,
        model: request.model,
        system: request.system,
        prompt: request.prompt,
        correction: request.prompt.startsWith('Corrige la spec'),
        round2: request.prompt.includes('Esta es una ronda de corrección'),
      }
      calls.push(entry)
      const index = counts[role]++
      const reply =
        role === 'writer'
          ? (script.writer?.(entry, index) ?? { data: CLEAN_WRITER })
          : role === 'reviewer'
            ? (script.reviewer?.(entry, index) ?? review([]))
            : (script.verifier?.(entry, index) ?? verdicts(request.prompt))
      if ('fail' in reply) throw new ProviderCallError(reply.fail, `${provider} falló con ${reply.fail}`)
      const usage = reply.usage ?? DEFAULT_USAGE[role]
      const text = 'raw' in reply ? reply.raw : JSON.stringify(reply.data)
      return { text, model: request.model, usage, costUsd: costUsd(request.model, usage) ?? 0, truncated: false }
    },
    async tools() {
      throw new ProviderCallError('server', 'sin herramientas')
    },
  }
}

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
