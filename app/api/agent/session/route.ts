import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { interviewTracks, isInterviewTrack } from '@/content/ailab/interview'
import { AGENT_DAILY_KEY, AGENT_MODEL, AGENT_SESSION_MINUTES, AGENT_TRIAL_MINUTES, needsTrial, type AgentSessionReply, type AgentStatus } from '@/lib/ai/agent/config'
import { signInMode } from '@/lib/auth/google'
import { getAccountState } from '@/lib/auth/accounts'
import { hasLabConsent } from '@/lib/ai/lab/traces'
import { agentInstruction } from '@/lib/ai/agent/knowledge'
import { guestBlock } from '@/lib/ai/agent/guest'
import { currentGuestMode, currentViewer } from '@/lib/ai/agent/viewer-server'
import { createLiveToken, isResumeHandle, liveSetup, LiveTokenError, withResumption } from '@/lib/ai/agent/session'
import { agentMode, geminiKey } from '@/lib/ai/gemini'
import { getRepos } from '@/lib/data'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'cache-control': 'private, no-store' }

function reply(body: AgentSessionReply, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE })
}

export async function GET(): Promise<NextResponse> {
  const viewer = await currentViewer()
  let labConsent = false
  if (viewer.kind === 'account' || viewer.kind === 'author') {
    try {
      const state = await getAccountState()
      labConsent = state ? await hasLabConsent(getRepos().lab, state.account.id) : false
    } catch (error) {
      logServerError('agent.status', error)
    }
  }
  const status: AgentStatus = { mode: agentMode(), viewer, trial: needsTrial(viewer, signInMode()), labConsent }
  return NextResponse.json(status, { headers: PRIVATE })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('origin') !== request.nextUrl.origin) return reply({ error: 'forbidden' }, 403)
  const mode = agentMode()
  const key = geminiKey()
  if (mode !== 'live' || !key) return reply({ mode: mode === 'live' ? 'off' : mode })

  const body = (await request.json().catch(() => null)) as { lang?: unknown; interview?: unknown; resume?: unknown } | null
  const interview = isInterviewTrack(body?.interview) && interviewTracks.es[body.interview].ready ? body.interview : undefined
  const resume = interview && isResumeHandle(body?.resume) ? body.resume : undefined
  const requested = body?.lang
  const lang = typeof requested === 'string' && isLocale(requested) ? requested : defaultLocale
  const now = new Date()
  const viewer = await currentViewer()
  const trial = needsTrial(viewer, signInMode())
  if (process.env.NODE_ENV !== 'development') {
    const repo = getRepos().rateLimits
    const ip = await requestIpHash()
    if (resume) {
      const resumed = await hitRateLimit(repo, 'agentResume', ip, now)
      if (!resumed.allowed) return reply({ error: 'rate_limited' }, 429)
      const daily = await hitRateLimit(repo, trial ? 'agentTrialDaily' : 'agentDaily', AGENT_DAILY_KEY, now)
      if (!daily.allowed) return reply({ error: 'daily_cap' }, 429)
    } else if (trial) {
      const used = await hitRateLimit(repo, 'agentTrial', ip, now)
      if (!used.allowed) return reply({ error: 'trial_used' }, 429)
      const daily = await hitRateLimit(repo, 'agentTrialDaily', AGENT_DAILY_KEY, now)
      if (!daily.allowed) return reply({ error: 'daily_cap' }, 429)
    } else {
      const limit = await hitRateLimit(repo, 'agent', ip, now)
      if (!limit.allowed) return reply({ error: 'rate_limited' }, 429)
      const daily = await hitRateLimit(repo, 'agentDaily', AGENT_DAILY_KEY, now)
      if (!daily.allowed) return reply({ error: 'daily_cap' }, 429)
    }
  }

  try {
    const guest = viewer.kind === 'guest' ? currentGuestMode() : null
    const instruction = await agentInstruction(lang, viewer, guest ? guestBlock(guest) : undefined, interview)
    const minutes = trial ? AGENT_TRIAL_MINUTES : AGENT_SESSION_MINUTES
    const setup = interview ? withResumption(liveSetup(instruction), resume) : undefined
    const { token, expiresAt } = await createLiveToken(key, instruction, now, fetch, minutes, setup)
    return reply({ mode: 'live', token, model: AGENT_MODEL, expiresAt, ...(trial ? { trial: true } : {}) })
  } catch (error) {
    logServerError('agent.session', error instanceof LiveTokenError ? error.message : error)
    if (error instanceof LiveTokenError && error.unavailable) return reply({ error: 'unavailable' }, 503)
    return reply({ error: 'failed' }, 502)
  }
}
