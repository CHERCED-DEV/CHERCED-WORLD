'use server'

import '@/lib/data/mongo/register'
import { z } from 'zod'
import { can } from '@/lib/accounts/permissions'
import {
  generateCover,
  rankSpam,
  reviewDraft,
  simulatedMeta,
  simulatedReview,
  simulatedSpam,
  simulatedTranslation,
  suggestMeta,
  translateDraft,
  type DraftText,
  type MetaSuggestion,
  type ReviewFinding,
  type SpamScore,
  type Translation,
} from '@/lib/ai/editorial/assist'
import { agentMode, geminiKey } from '@/lib/ai/gemini'
import { GeminiError } from '@/lib/ai/generate'
import { getPanelActor } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import type { Permission } from '@/lib/data/types'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit, type RateLimitAction } from '@/lib/security/rate-limit'

export type AssistError = 'unauthorized' | 'validation' | 'rate_limited' | 'unavailable' | 'failed'

export type AssistResult<T> = { ok: true; data: T; simulated: boolean } | { ok: false; error: AssistError }

const draftText = z.object({
  lang: z.enum(['es', 'en']),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(320),
  body: z.string().min(1).max(100_000),
  tags: z.array(z.string().trim().min(1).max(60)).max(12),
})

type Gate = { ok: true; key: string | null } | { ok: false; error: AssistError }

async function gate(permission: Permission, limits: { actor: RateLimitAction; daily: RateLimitAction }): Promise<Gate> {
  const actor = await getPanelActor()
  if (!actor || !can(actor, permission)) return { ok: false, error: 'unauthorized' }
  const key = geminiKey()
  if (agentMode() !== 'live' || !key) return { ok: true, key: null }
  if (process.env.NODE_ENV !== 'development') {
    const repo = getRepos().rateLimits
    const now = new Date()
    const who = actor.kind === 'owner' ? 'owner' : actor.account.id
    if (!(await hitRateLimit(repo, limits.actor, who, now)).allowed) return { ok: false, error: 'rate_limited' }
    if (!(await hitRateLimit(repo, limits.daily, 'global', now)).allowed) return { ok: false, error: 'rate_limited' }
  }
  return { ok: true, key }
}

function failure(scope: string, error: unknown): { ok: false; error: AssistError } {
  logServerError(scope, error)
  if (error instanceof GeminiError && error.unavailable) return { ok: false, error: 'unavailable' }
  return { ok: false, error: 'failed' }
}

const TEXT_LIMITS = { actor: 'panelAi', daily: 'panelAiDaily' } as const

async function withDraft<T>(scope: string, input: unknown, run: (key: string, draft: DraftText) => Promise<T>, simulate: (draft: DraftText) => T): Promise<AssistResult<T>> {
  const parsed = draftText.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'validation' }
  const access = await gate('posts', TEXT_LIMITS)
  if (!access.ok) return access
  if (!access.key) return { ok: true, data: simulate(parsed.data), simulated: true }
  try {
    return { ok: true, data: await run(access.key, parsed.data), simulated: false }
  } catch (error) {
    return failure(scope, error)
  }
}

export async function assistTranslate(input: unknown): Promise<AssistResult<Translation>> {
  return withDraft('panel.translate', input, (key, draft) => translateDraft(key, draft), simulatedTranslation)
}

export async function assistReview(input: unknown): Promise<AssistResult<ReviewFinding[]>> {
  return withDraft('panel.review', input, (key, draft) => reviewDraft(key, draft), simulatedReview)
}

export async function assistMeta(input: unknown): Promise<AssistResult<MetaSuggestion>> {
  return withDraft('panel.meta', input, (key, draft) => suggestMeta(key, draft), simulatedMeta)
}

export async function assistCover(input: unknown): Promise<AssistResult<{ mimeType: string; data: string } | null>> {
  const parsed = draftText.pick({ title: true, tags: true }).safeParse(input)
  if (!parsed.success) return { ok: false, error: 'validation' }
  const access = await gate('posts', { actor: 'panelCover', daily: 'panelCoverDaily' })
  if (!access.ok) return access
  if (!access.key) return { ok: true, data: null, simulated: true }
  try {
    return { ok: true, data: await generateCover(access.key, parsed.data), simulated: false }
  } catch (error) {
    return failure('panel.cover', error)
  }
}

export async function rankPendingComments(): Promise<AssistResult<SpamScore[]>> {
  const access = await gate('comments', TEXT_LIMITS)
  if (!access.ok) return access
  try {
    const pending = (await getRepos().comments.listForModeration({ status: 'pending' })).slice(0, 40)
    const texts = pending.map((comment) => ({ id: comment.id, text: comment.comment }))
    if (!access.key) return { ok: true, data: simulatedSpam(texts), simulated: true }
    return { ok: true, data: await rankSpam(access.key, texts), simulated: false }
  } catch (error) {
    return failure('panel.spam', error)
  }
}
