import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { ARENA_FREE_MAX, ARENA_FREE_MIN, arenaTask, freeTask } from '@/content/ailab/arena/tasks'
import { getAccountState } from '@/lib/auth/accounts'
import { json } from '@/lib/ai/lab/route'
import { SPEND_GLOBAL_KEY } from '@/lib/ai/spend'
import { arenaModels, ARENA_LIVE_MAX_USD, buildRun, compareCase, comparisonEstimateUsd, runnable, type ArenaRunnable } from '@/lib/ai/providers/arena'
import { keyedProviders, providerKeys } from '@/lib/ai/providers/mode'
import { assertMonthlyBudget, BudgetExhaustedError, BudgetUnavailableError, generateJson, providersMode } from '@/lib/ai/providers/port'
import { getRepos } from '@/lib/data'
import { defaultLocale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const bodySchema = z.object({
  lang: z.enum(['es', 'en']).optional(),
  taskId: z.string().max(40).optional(),
  free: z.string().optional(),
  consent: z.boolean().optional(),
})

async function signedIn(): Promise<boolean> {
  try {
    return Boolean(await getAccountState())
  } catch (error) {
    logServerError('ailab.arena.account', error)
    return false
  }
}

export async function GET() {
  return json({ mode: providersMode(), signedIn: await signedIn() })
}

function chooseTask(body: z.infer<typeof bodySchema>): { task: ArenaRunnable } | { error: 'invalid' | 'too_long' } {
  const lang = body.lang ?? defaultLocale
  if (typeof body.free === 'string' && body.free.trim()) {
    const text = body.free.trim()
    if (text.length > ARENA_FREE_MAX) return { error: 'too_long' }
    if (text.length < ARENA_FREE_MIN) return { error: 'invalid' }
    return { task: { ...freeTask(lang, text), id: null } }
  }
  const fixed = body.taskId ? arenaTask(body.taskId) : undefined
  return fixed ? { task: runnable(fixed) } : { error: 'invalid' }
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return json({ error: 'forbidden' }, 403)
  const mode = providersMode()
  if (mode === 'off') return json({ error: 'off' }, 503)

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid' }, 400)
  const chosen = chooseTask(parsed.data)
  if ('error' in chosen) return json({ error: chosen.error }, chosen.error === 'too_long' ? 413 : 400)
  if (parsed.data.consent !== true) return json({ error: 'consent' }, 400)

  let account: Awaited<ReturnType<typeof getAccountState>>
  try {
    account = await getAccountState()
  } catch (error) {
    logServerError('ailab.arena.account', error)
    return json({ error: 'off' }, 503)
  }
  if (!account) return json({ error: 'account' }, 401)

  const now = new Date()
  const live = mode === 'live'
  const estimateUsd = live ? comparisonEstimateUsd(chosen.task, keyedProviders(providerKeys())) : 0
  if (estimateUsd > ARENA_LIVE_MAX_USD) return json({ error: 'too_expensive' }, 422)

  try {
    if (live) await assertMonthlyBudget(estimateUsd)
  } catch (error) {
    if (error instanceof BudgetExhaustedError) return json({ error: 'budget' }, 503)
    logServerError('ailab.arena.budget', error)
    return json({ error: 'off' }, 503)
  }

  if (live && process.env.NODE_ENV !== 'development') {
    const repo = getRepos().rateLimits
    const visitor = await hitRateLimit(repo, 'arena', account.account.id, now)
    if (!visitor.allowed) return json({ error: 'rate_limited' }, 429)
    const daily = await hitRateLimit(repo, 'arenaDaily', SPEND_GLOBAL_KEY, now)
    if (!daily.allowed) return json({ error: 'daily_cap' }, 429)
  }

  try {
    const entry = await compareCase(chosen.task, { generate: generateJson, models: arenaModels() })
    return json({ run: buildRun({ mode: 'vivo', simulated: !live, cases: [entry], now }) })
  } catch (error) {
    if (error instanceof BudgetExhaustedError) return json({ error: 'budget' }, 503)
    logServerError('ailab.arena', error)
    if (error instanceof BudgetUnavailableError) return json({ error: 'off' }, 503)
    return json({ error: 'failed' }, 502)
  }
}
