export const MATCH_MODEL = 'gemini-3.8-flash'

export const MATCH_ENDPOINT = '/api/ailab/match'

export const MATCH_DAILY_KEY = 'global'

export const VACANCY_MIN = 80

export const VACANCY_MAX = 8000

export const MATCH_MAX_REQUIREMENTS = 15

export const MATCH_MAX_EVIDENCE = 3

export const MATCH_QUESTIONS = 3

export const MATCH_TEXT_MAX = 220

export const MATCH_ROLE_MAX = 90

export const MATCH_LEVELS = ['fuerte', 'parcial', 'sin_evidencia'] as const

export type MatchLevel = (typeof MATCH_LEVELS)[number]

export const MATCH_KINDS = ['obligatorio', 'deseable'] as const

export type MatchKind = (typeof MATCH_KINDS)[number]

export type MatchMode = 'live' | 'local' | 'off'

export type MatchEvidence = { id: string; title: string; url: string; kind: string }

export type MatchRequirement = { text: string; kind: MatchKind; level: MatchLevel; evidence: MatchEvidence[]; note: string }

export type MatchCoverage = { total: number; covered: number; required: number; requiredCovered: number }

export type MatchResult = {
  mode: 'live' | 'local'
  role: string
  requirements: MatchRequirement[]
  questions: string[]
  coverage: MatchCoverage
  dropped: number
  costUsd: number
}

export type MatchError = 'off' | 'invalid' | 'too_long' | 'rate_limited' | 'daily_cap' | 'unavailable' | 'failed' | 'forbidden'

export type MatchReply = MatchResult | { error: MatchError }

export function isMatchResult(value: unknown): value is MatchResult {
  if (!value || typeof value !== 'object') return false
  const reply = value as Record<string, unknown>
  return (
    (reply.mode === 'live' || reply.mode === 'local') &&
    typeof reply.role === 'string' &&
    Array.isArray(reply.requirements) &&
    Array.isArray(reply.questions) &&
    typeof reply.coverage === 'object' &&
    reply.coverage !== null
  )
}

export function coverageOf(requirements: readonly Pick<MatchRequirement, 'kind' | 'level'>[]): MatchCoverage {
  const covered = requirements.filter((item) => item.level !== 'sin_evidencia')
  const required = requirements.filter((item) => item.kind === 'obligatorio')
  return {
    total: requirements.length,
    covered: covered.length,
    required: required.length,
    requiredCovered: required.filter((item) => item.level !== 'sin_evidencia').length,
  }
}
