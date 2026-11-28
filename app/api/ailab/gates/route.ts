import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { gateExample } from '@/content/ailab/gates/examples'
import { gateAccount, liveDeps, streamGate } from '@/lib/ai/gates/http'
import { liveEstimateUsd, runGate } from '@/lib/ai/gates/run'
import { REQUEST_MAX, REQUEST_MIN, type GateRequest } from '@/lib/ai/gates/schema'
import { sealRun } from '@/lib/ai/gates/seal'
import { GATE_RUN_CAP_USD, overCap } from '@/lib/ai/gates/stop'
import { json } from '@/lib/ai/lab/route'
import { SPEND_GLOBAL_KEY } from '@/lib/ai/spend'
import { assertMonthlyBudget, availableProviders, BudgetExhaustedError, providersMode } from '@/lib/ai/providers/port'
import { getRepos } from '@/lib/data'
import { defaultLocale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const bodySchema = z.object({
  lang: z.enum(['es', 'en']).optional(),
  exampleId: z.string().max(40).optional(),
  text: z.string().max(5000).optional(),
  consent: z.boolean().optional(),
})

export async function GET() {
  const account = await gateAccount('ailab.gates.account')
  return json({ mode: providersMode(), signedIn: Boolean(account && account !== 'unavailable') })
}

function chooseRequest(body: z.infer<typeof bodySchema>): { request: GateRequest } | { error: 'invalid' | 'too_long' | 'too_short' } {
  const lang = body.lang ?? defaultLocale
  if (typeof body.text === 'string' && body.text.trim()) {
    const text = body.text.trim()
    if (text.length > REQUEST_MAX) return { error: 'too_long' }
    if (text.length < REQUEST_MIN) return { error: 'too_short' }
    return { request: { text, lang, source: 'propio', exampleId: null } }
  }
  const example = body.exampleId ? gateExample(body.exampleId) : undefined
  return example ? { request: { text: example.text[lang], lang, source: 'ejemplo', exampleId: example.id } } : { error: 'invalid' }
}

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return json({ error: 'forbidden' }, 403)
  const mode = providersMode()
  if (mode === 'off') return json({ error: 'off' }, 503)

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return json({ error: 'invalid' }, 400)
  const chosen = chooseRequest(parsed.data)
  if ('error' in chosen) return json({ error: chosen.error }, chosen.error === 'too_long' ? 413 : 400)
  if (parsed.data.consent !== true) return json({ error: 'consent' }, 400)

  const account = await gateAccount('ailab.gates.account')
  if (account === 'unavailable') return json({ error: 'off' }, 503)
  if (!account) return json({ error: 'account' }, 401)

  const live = mode === 'live'
  const estimateUsd = live ? liveEstimateUsd(availableProviders()) : 0
  if (overCap(0, estimateUsd, GATE_RUN_CAP_USD)) return json({ error: 'too_expensive' }, 422)

  try {
    if (live) await assertMonthlyBudget(estimateUsd)
  } catch (error) {
    if (error instanceof BudgetExhaustedError) return json({ error: 'budget' }, 503)
    logServerError('ailab.gates.budget', error)
    return json({ error: 'off' }, 503)
  }

  if (live && process.env.NODE_ENV !== 'development') {
    const now = new Date()
    const repo = getRepos().rateLimits
    const visitor = await hitRateLimit(repo, 'gates', account.id, now)
    if (!visitor.allowed) return json({ error: 'rate_limited' }, 429)
    const daily = await hitRateLimit(repo, 'gatesDaily', SPEND_GLOBAL_KEY, now)
    if (!daily.allowed) return json({ error: 'daily_cap' }, 429)
  }

  return streamGate(
    'ailab.gates',
    (emit) => runGate(chosen.request, liveDeps(emit)),
    (run) => sealRun(run, account.id),
  )
}
