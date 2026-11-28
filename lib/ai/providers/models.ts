import type { ModelTask, PaidProviderId } from './types'

export const MODELS_CHECKED_AT = '2026-11-27'

export const PROVIDER_MODELS: Readonly<Record<PaidProviderId, Readonly<Record<ModelTask, string>>>> = {
  gemini: { cheap: 'gemini-3.8-flash', balanced: 'gemini-3.8-flash', strong: 'gemini-4-argon' },
  claude: { cheap: 'claude-haiku-5-5', balanced: 'claude-sonnet-5-5', strong: 'claude-opus-5-5' },
  openai: { cheap: 'gpt-6-luna', balanced: 'gpt-6.2-sol', strong: 'gpt-6.2-astra' },
}

export const MODELS_PENDING_APPROVAL: readonly string[] = ['gemini-4-argon', 'gpt-6-luna', 'gpt-6.2-sol', 'gpt-6.2-astra']

export type TaskEffort = 'low' | 'medium' | 'high'

export const TASK_EFFORT: Readonly<Record<ModelTask, TaskEffort>> = { cheap: 'low', balanced: 'medium', strong: 'high' }

export const TASK_MAX_OUTPUT_TOKENS: Readonly<Record<ModelTask, number>> = { cheap: 2048, balanced: 4096, strong: 8192 }

export const CLAUDE_SERVER_FALLBACK_BETA = 'server-side-fallback-2026-07-01'

export const CLAUDE_FALLBACK_TARGETS: Readonly<Record<string, readonly string[]>> = {
  'claude-opus-5-5': ['claude-opus-5', 'claude-opus-4-8'],
  'claude-sonnet-5-5': ['claude-sonnet-5'],
}

export function modelFor(provider: PaidProviderId, task: ModelTask): string {
  return PROVIDER_MODELS[provider][task]
}

export function usesServerFallback(model: string): boolean {
  return Object.hasOwn(CLAUDE_FALLBACK_TARGETS, model)
}

export function fallbackTargets(model: string): readonly string[] {
  return CLAUDE_FALLBACK_TARGETS[model] ?? []
}

export function portModels(): string[] {
  const models = new Set<string>()
  for (const tasks of Object.values(PROVIDER_MODELS)) {
    for (const model of Object.values(tasks)) {
      models.add(model)
      for (const target of fallbackTargets(model)) models.add(target)
    }
  }
  return [...models]
}
