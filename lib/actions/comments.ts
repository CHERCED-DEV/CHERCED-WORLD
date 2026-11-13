'use server'

import '@/lib/data/mongo/register'
import { isKnownPost } from '@/lib/blog/source'
import { getRepos } from '@/lib/data'
import type { PublicComment } from '@/lib/data/types'
import { defaultLocale, isLocale } from '@/lib/i18n'
import { isHoneypotFilled, isTooFast } from '@/lib/security/anti-spam'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash, requestLocale } from '@/lib/security/request'
import { commentSchema, parseForm } from '@/lib/validation'
import { fail, ok, type ActionResult } from './result'

export async function submitComment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (isHoneypotFilled(formData)) return ok()

  const parsed = parseForm(commentSchema, formData)
  if (!parsed.success) {
    const error = parsed.fieldErrors.consent ? 'consent_required' : 'validation'
    return fail(error, { fieldErrors: parsed.fieldErrors })
  }
  if (!(await isKnownPost(parsed.data.postId))) return fail('not_found')

  const now = new Date()
  if (isTooFast(formData, now)) return fail('validation')

  try {
    const repos = getRepos()
    const limit = await hitRateLimit(repos.rateLimits, 'comment', await requestIpHash(), now)
    if (!limit.allowed) return fail('rate_limited', { retryAfterMs: limit.retryAfterMs })

    const field = formData.get('lang')
    const lang = typeof field === 'string' && isLocale(field) ? field : await requestLocale(defaultLocale)
    const { postId, userName, email, comment } = parsed.data
    await repos.comments.create({ postId, userName, email, comment, lang, consentAt: now })
    return ok()
  } catch (error) {
    logServerError('comments.submit', error)
    return fail('unavailable')
  }
}

export async function getApprovedComments(postId: string): Promise<PublicComment[]> {
  if (typeof postId !== 'string' || !(await isKnownPost(postId))) return []
  try {
    const comments = await getRepos().comments.listPublic(postId)
    return comments.map(({ id, userName, comment, createdAt, authorReply }) => ({
      id,
      userName,
      comment,
      createdAt,
      authorReply: authorReply ? { text: authorReply.text, createdAt: authorReply.createdAt, updatedAt: authorReply.updatedAt } : null,
    }))
  } catch (error) {
    logServerError('comments.listPublic', error)
    return []
  }
}
