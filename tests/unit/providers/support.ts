import { createMemoryBudgetRepo } from '@/lib/data/memory/budget'
import type { BudgetRepo } from '@/lib/data/types'
import type { JsonReply, JsonRequest, ProviderAdapter, ToolsReply, ToolsRequest } from '@/lib/ai/providers/adapter'
import { costUsd } from '@/lib/ai/providers/cost'
import type { PortDeps } from '@/lib/ai/providers/core'
import { ProviderCallError, type FailureKind } from '@/lib/ai/providers/errors'
import type { ProviderKeys } from '@/lib/ai/providers/mode'
import { createPort } from '@/lib/ai/providers/port'
import type { PaidProviderId, ProvidersMode } from '@/lib/ai/providers/types'

export const FAKE_KEYS = {
  gemini: 'AIzaSyFAKE-not-a-real-key-000000000000',
  claude: 'sk-ant-api03-FAKE-not-a-real-key-000000000000',
  openai: 'sk-proj-FAKE-not-a-real-key-000000000000',
} as const satisfies Record<PaidProviderId, string>

export type Step = { text: string; model?: string; usage?: { inputTokens: number; outputTokens: number }; truncated?: boolean } | { fail: FailureKind; message?: string }

export type FakeAdapter = ProviderAdapter & { jsonCalls: JsonRequest[]; toolCalls: ToolsRequest[] }

export function fakeAdapter(id: PaidProviderId, steps: Step[], tools: ToolsReply[] = []): FakeAdapter {
  const queue = [...steps]
  const toolQueue = [...tools]
  const jsonCalls: JsonRequest[] = []
  const toolCalls: ToolsRequest[] = []
  return {
    id,
    jsonCalls,
    toolCalls,
    async json(request): Promise<JsonReply> {
      jsonCalls.push(request)
      const step = queue.shift() ?? { text: '{}' }
      if ('fail' in step) throw new ProviderCallError(step.fail, step.message ?? `${id} falló con ${step.fail}`)
      const usage = step.usage ?? { inputTokens: 1000, outputTokens: 200 }
      const model = step.model ?? request.model
      return { text: step.text, model, usage, costUsd: costUsd(model, usage) ?? 0, truncated: step.truncated ?? false }
    },
    async tools(request): Promise<ToolsReply> {
      toolCalls.push(request)
      const reply = toolQueue.shift()
      if (!reply) throw new ProviderCallError('server', `${id} sin respuesta grabada`)
      return reply
    },
  }
}

export type TestPort = ReturnType<typeof createPort> & { budget: BudgetRepo; loaded: PaidProviderId[] }

export function testPort(options: {
  adapters: Partial<Record<PaidProviderId, ProviderAdapter>>
  keys?: ProviderKeys
  mode?: ProvidersMode
  budget?: BudgetRepo
  now?: Date
  models?: PortDeps['models']
}): TestPort {
  const budget = options.budget ?? createMemoryBudgetRepo()
  const loaded: PaidProviderId[] = []
  const keys = options.keys ?? Object.fromEntries(Object.keys(options.adapters).map((provider) => [provider, FAKE_KEYS[provider as PaidProviderId]]))
  const port = createPort({
    mode: () => options.mode ?? 'live',
    keys: () => keys,
    adapter: async (provider) => {
      loaded.push(provider)
      const adapter = options.adapters[provider]
      if (!adapter) throw new Error(`sin adaptador de prueba para ${provider}`)
      return adapter
    },
    budget: () => budget,
    now: () => options.now ?? new Date('2026-11-27T15:00:00.000Z'),
    timeoutMs: 1000,
    models: options.models,
  })
  return Object.assign(port, { budget, loaded })
}
