import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { gateAccount, liveDeps, streamGate } from '@/lib/ai/gates/http'
import { changesEstimateUsd, continueGate } from '@/lib/ai/gates/run'
import { COMMENT_MAX, gateRunSchema } from '@/lib/ai/gates/schema'
import { sealFresh, sealRun, sealValid } from '@/lib/ai/gates/seal'
import { overCap } from '@/lib/ai/gates/stop'
import { canRequestChanges } from '@/lib/ai/gates/view'
import { json } from '@/lib/ai/lab/route'
import { assertMonthlyBudget, availableProviders, BudgetExhaustedError, providersMode } from '@/lib/ai/providers/port'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'
import { RATE_LIMITS } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const bodySchema = z.object({
  lang: z.enum(['es', 'en']).optional(),
  run: z.unknown(),
  comment: z.string().max(5000),
  consent: z.boolean().optional(),
})

const CHANGES_KEY_PREFIX = 'gates:ronda:'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return json({ error: 'forbidden' }, 403)
  const mode = providersMode()
  if (mode === 'off') return json({ error: 'off' }, 503)

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid' }, 400)
  const comment = parsed.data.comment.trim()
  if (!comment) return json({ error: 'invalid' }, 400)
  if (comment.length > COMMENT_MAX) return json({ error: 'too_long' }, 413)
  if (parsed.data.consent !== true) return json({ error: 'consent' }, 400)

  const account = await gateAccount('ailab.gates.changes.account')
  if (account === 'unavailable') return json({ error: 'off' }, 503)
  if (!account) return json({ error: 'account' }, 401)

  const checked = gateRunSchema.safeParse(parsed.data.run)
  if (!checked.success) return json({ error: 'invalid_run' }, 400)
  const run = checked.data
  if (run.mode !== 'vivo') return json({ error: 'not_allowed' }, 409)
  if (!sealValid(run, account.id) || run.simulated !== (mode === 'local')) return json({ error: 'invalid_run' }, 400)
  const now = new Date()
  if (!sealFresh(run, now)) return json({ error: 'expired' }, 410)
  if (!canRequestChanges(run)) return json({ error: run.rounds.some((round) => round.round === 3) ? 'already' : 'not_allowed' }, 409)

  const spentUsd = Math.max(run.totalUsd, run.steps.reduce((sum, step) => sum + step.costUsd, 0))
  const estimateUsd = changesEstimateUsd(run, availableProviders())
  if (overCap(spentUsd, estimateUsd, run.capUsd)) return json({ error: 'run_cap' }, 422)

  try {
    if (mode === 'live') await assertMonthlyBudget(estimateUsd)
  } catch (error) {
    if (error instanceof BudgetExhaustedError) return json({ error: 'budget' }, 503)
    logServerError('ailab.gates.changes.budget', error)
    return json({ error: 'off' }, 503)
  }

  const once = await getRepos().rateLimits.hit(`${CHANGES_KEY_PREFIX}${run.seal!.slice(0, 40)}`, { limit: 1, windowMs: RATE_LIMITS.gates.windowMs }, now)
  if (!once.allowed) return json({ error: 'already' }, 409)

  return streamGate(
    'ailab.gates.changes',
    (emit) => continueGate(run, comment, liveDeps(emit)),
    (next) => sealRun(next, account.id),
  )
}
