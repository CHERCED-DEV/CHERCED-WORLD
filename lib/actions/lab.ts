'use server'

import '@/lib/data/mongo/register'
import { refresh } from 'next/cache'
import { LAB_CONSENT_VERSION } from '@/lib/ai/lab/traces'
import { getAccountState } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import type { AccountRecord, Repos } from '@/lib/data/types'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { fail, ok, type ActionResult } from './result'

const MAX_ID_LENGTH = 64

async function withAccount(scope: string, run: (repos: Repos, account: AccountRecord, now: Date) => Promise<ActionResult>): Promise<ActionResult> {
  try {
    const state = await getAccountState()
    if (!state) return fail('unauthorized')
    const repos = getRepos()
    const now = new Date()
    const hit = await hitRateLimit(repos.rateLimits, 'labConsent', state.account.id, now)
    if (!hit.allowed) return fail('rate_limited', { retryAfterMs: hit.retryAfterMs })
    return await run(repos, state.account, now)
  } catch (error) {
    logServerError(scope, error)
    return fail('unavailable')
  }
}

export async function acceptLabConsent(): Promise<ActionResult> {
  return withAccount('lab.consent', async (repos, account, now) => {
    await repos.lab.setConsent(account.id, LAB_CONSENT_VERSION, now)
    return ok()
  })
}

export async function revokeLabConsent(): Promise<ActionResult> {
  return withAccount('lab.revoke', async (repos, account, now) => {
    await repos.lab.revokeConsent(account.id, now)
    refresh()
    return ok()
  })
}

export async function deleteLabSession(id: unknown): Promise<ActionResult> {
  if (typeof id !== 'string' || !id || id.length > MAX_ID_LENGTH) return fail('validation')
  return withAccount('lab.delete', async (repos, account) => {
    const removed = await repos.lab.removeSession(account.id, id)
    if (!removed) return fail('validation')
    refresh()
    return ok()
  })
}
