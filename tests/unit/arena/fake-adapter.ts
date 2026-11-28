import type { ProviderAdapter } from '@/lib/ai/providers/adapter'
import { costUsd } from '@/lib/ai/providers/cost'
import { ProviderCallError } from '@/lib/ai/providers/errors'
import type { PaidProviderId } from '@/lib/ai/providers/types'
import { ARENA_TASKS, type ArenaTask } from '@/content/ailab/arena/tasks'
import { JUDGE_RUBRIC } from '@/content/ailab/arena/judge'

export type ArenaCall = { provider: PaidProviderId; judge: boolean; system: string; prompt: string; model: string }

export type ArenaAdapterOptions = { answer?: (task: ArenaTask | undefined) => unknown; score?: number; fail?: boolean }

export function arenaAdapter(provider: PaidProviderId, calls: ArenaCall[], options: ArenaAdapterOptions = {}): ProviderAdapter {
  return {
    id: provider,
    async json(request) {
      const judge = Object.values(JUDGE_RUBRIC).includes(request.system)
      calls.push({ provider, judge, system: request.system, prompt: request.prompt, model: request.model })
      if (options.fail && !judge) throw new ProviderCallError('server', `${provider} caído (503)`)
      const usage = judge ? { inputTokens: 1200, outputTokens: 150 } : { inputTokens: 1500, outputTokens: 600 }
      const task = ARENA_TASKS.find((item) => item.instruction === request.system)
      const data = judge ? { score: options.score ?? 3, reason: `Juez ${provider}: cumple.` } : options.answer ? options.answer(task) : (task?.sample ?? { answer: `respuesta de ${provider}` })
      return { text: JSON.stringify(data), model: request.model, usage, costUsd: costUsd(request.model, usage) ?? 0, truncated: false }
    },
    async tools() {
      throw new ProviderCallError('server', 'sin herramientas')
    },
  }
}
