import 'server-only'
import { geminiKey } from '@/lib/ai/gemini'
import { repoBackend } from '@/lib/data/mongo/register'
import { PAID_PROVIDERS, type PaidProviderId, type ProviderId, type ProvidersMode } from './types'

export const ANTHROPIC_API_KEY_ENV = 'ANTHROPIC_API_KEY'

export const OPENAI_API_KEY_ENV = 'OPENAI_API_KEY'

type Env = Record<string, string | undefined>

export type ProviderKeys = Partial<Record<PaidProviderId, string>>

export function providerKeys(env: Env = process.env): ProviderKeys {
  const keys: ProviderKeys = {}
  const gemini = geminiKey(env)
  const claude = env[ANTHROPIC_API_KEY_ENV]?.trim()
  const openai = env[OPENAI_API_KEY_ENV]?.trim()
  if (gemini) keys.gemini = gemini
  if (claude) keys.claude = claude
  if (openai) keys.openai = openai
  return keys
}

export function keyedProviders(keys: ProviderKeys): PaidProviderId[] {
  return PAID_PROVIDERS.filter((provider) => Boolean(keys[provider]))
}

export function modeFor(keys: ProviderKeys, env: Env = process.env): ProvidersMode {
  if (keyedProviders(keys).length > 0) return 'live'
  return repoBackend(env) === 'memory' ? 'local' : 'off'
}

export function providersMode(env: Env = process.env): ProvidersMode {
  return modeFor(providerKeys(env), env)
}

export function availableProviders(env: Env = process.env): ProviderId[] {
  const keys = providerKeys(env)
  const mode = modeFor(keys, env)
  if (mode === 'local') return ['simulator']
  return keyedProviders(keys)
}
