'use server'

import '@/lib/data/mongo/register'
import { getAccountState } from '@/lib/auth/accounts'
import { isKnownPost } from '@/lib/blog/source'
import { getRepos } from '@/lib/data'
import type { PublicComment } from '@/lib/data/types'
import { defaultLocale, isLocale } from '@/lib/i18n'
import { isHoneypotFilled, isTooFast } from '@/lib/security/anti-spam'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash, requestLocale } from '@/lib/security/request'
import { accountCommentSchema, commentSchema, parseForm } from '@/lib/validation'
import { fail, ok, type ActionResult } from './result'

type CommentDraft = { postId: string; comment: string; author: { userName: string; email: string } | null }

function parseComment(formData: FormData): { ok: true; draft: CommentDraft } | { ok: false; result: ActionResult } {
  const invalid = (fieldErrors: Record<string, string>) => ({
    ok: false as const,
    result: fail(fieldErrors.consent ? 'consent_required' : 'validation', { fieldErrors }),
  })
  if (formData.get('account') === '1') {
    const parsed = parseForm(accountCommentSchema, formData)
    if (!parsed.success) return invalid(parsed.fieldErrors)
    return { ok: true, draft: { postId: parsed.data.postId, comment: parsed.data.comment, author: null } }
  }
  const parsed = parseForm(commentSchema, formData)
  if (!parsed.success) return invalid(parsed.fieldErrors)
  const { postId, comment, userName, email } = parsed.data
  return { ok: true, draft: { postId, comment, author: { userName, email } } }
}

export async function submitComment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (isHoneypotFilled(formData)) return ok()

  const parsed = parseComment(formData)
  if (!parsed.ok) return parsed.result
  const { postId, comment, author } = parsed.draft
  if (!(await isKnownPost(postId))) return fail('not_found')

  const now = new Date()
  if (isTooFast(formData, now)) return fail('validation')

  try {
    const repos = getRepos()
    const limit = await hitRateLimit(repos.rateLimits, 'comment', await requestIpHash(), now)
    if (!limit.allowed) return fail('rate_limited', { retryAfterMs: limit.retryAfterMs })

    const field = formData.get('lang')
    const lang = typeof field === 'string' && isLocale(field) ? field : await requestLocale(defaultLocale)
    if (author) {
      await repos.comments.create({ postId, userName: author.userName, email: author.email, comment, lang, consentAt: now })
      return ok()
    }
    const state = await getAccountState()
    if (!state) return fail('unauthorized')
    await repos.comments.create({ postId, userName: state.account.name, email: state.account.email, comment, lang, consentAt: now, accountId: state.account.id })
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
