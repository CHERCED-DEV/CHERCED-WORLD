export const AGENT_MODEL = 'gemini-3.8-live'

export const AGENT_VOICE = 'Puck'

export const AGENT_NAME = 'Mini Cherced'

export const AGENT_SESSION_MINUTES = 5

export const AGENT_SESSION_ENDPOINT = '/api/agent/session'

export const AGENT_DAILY_KEY = 'global'

export const AGENT_SEARCH_LIMIT = 5

export const AGENT_FRAGMENT_MAX = 600

export type AgentMode = 'live' | 'local' | 'off'

export type AgentStatus = { mode: AgentMode }

export function isAgentStatus(value: unknown): value is AgentStatus {
  if (!value || typeof value !== 'object') return false
  const mode = (value as Record<string, unknown>).mode
  return mode === 'live' || mode === 'local' || mode === 'off'
}

export type AgentSessionGrant = { mode: 'live'; token: string; model: string; expiresAt: string }

export type AgentSessionReply =
  | AgentSessionGrant
  | { mode: 'local' }
  | { mode: 'off' }
  | { error: 'rate_limited' | 'daily_cap' | 'unavailable' | 'failed' | 'forbidden' }

export function isAgentGrant(value: unknown): value is AgentSessionGrant {
  if (!value || typeof value !== 'object') return false
  const reply = value as Record<string, unknown>
  return reply.mode === 'live' && typeof reply.token === 'string' && typeof reply.model === 'string' && typeof reply.expiresAt === 'string'
}
