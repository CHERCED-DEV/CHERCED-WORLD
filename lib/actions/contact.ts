'use server'

import '@/lib/data/mongo/register'
import { getRepos } from '@/lib/data'
import { isHoneypotFilled, isTooFast } from '@/lib/security/anti-spam'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'
import { contactSchema, parseForm } from '@/lib/validation'
import { fail, ok, type ActionResult } from './result'

export async function submitContact(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (isHoneypotFilled(formData)) return ok()

  const parsed = parseForm(contactSchema, formData)
  if (!parsed.success) {
    const error = parsed.fieldErrors.consent ? 'consent_required' : 'validation'
    return fail(error, { fieldErrors: parsed.fieldErrors })
  }

  const now = new Date()
  if (isTooFast(formData, now)) return fail('validation')

  try {
    const repos = getRepos()
    const limit = await hitRateLimit(repos.rateLimits, 'contact', await requestIpHash(), now)
    if (!limit.allowed) return fail('rate_limited', { retryAfterMs: limit.retryAfterMs })

    const { name, email, phone, message, interest } = parsed.data
    await repos.messages.create({ name, email, phone, message, interest: interest ?? null, consentAt: now })
    return ok()
  } catch (error) {
    logServerError('contact.submit', error)
    return fail('unavailable')
  }
}
