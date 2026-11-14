import 'server-only'
import type { AgentMode } from '@/lib/ai/agent/config'
import { repoBackend } from '@/lib/data/mongo/register'

export const GEMINI_API_KEY_ENV = 'GEMINI_API_KEY'

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

type Env = Record<string, string | undefined>

export function geminiKey(env: Env = process.env): string | null {
  return env[GEMINI_API_KEY_ENV]?.trim() || null
}

export function agentMode(env: Env = process.env): AgentMode {
  if (geminiKey(env)) return 'live'
  return repoBackend(env) === 'memory' ? 'local' : 'off'
}
