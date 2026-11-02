'use server'

import '@/lib/data/mongo/register'
import { refresh, revalidatePath } from 'next/cache'
import { requireAdmin, UnauthorizedError } from '@/lib/auth/guard'
import { getRepos } from '@/lib/data'
import type { CommentStatus, MessageStatus, Repos } from '@/lib/data/types'
import { logServerError } from '@/lib/security/log'
import { parseInput, replySchema } from '@/lib/validation'
import { fail, ok, type ActionResult } from './result'

const MESSAGE_STATUSES: readonly string[] = ['unread', 'read', 'archived']

const COMMENT_STATUSES: readonly string[] = ['pending', 'approved', 'rejected']

const MAX_ID_LENGTH = 64

function validId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= MAX_ID_LENGTH
}

async function asAdmin(scope: string, run: (repos: Repos) => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail('unauthorized')
    logServerError(scope, error)
    return fail('unavailable')
  }
  try {
    return await run(getRepos())
  } catch (error) {
    logServerError(scope, error)
    return fail('unavailable')
  }
}

function refreshPanel(): void {
  refresh()
}

function refreshPublicComments(): void {
  revalidatePath('/[lang]/blog/[id]', 'page')
  refresh()
}

export async function setMessageStatus(id: string, status: MessageStatus): Promise<ActionResult> {
  return asAdmin('admin.setMessageStatus', async (repos) => {
    if (!validId(id) || !MESSAGE_STATUSES.includes(status)) return fail('validation')
    if (!(await repos.messages.setStatus(id, status))) return fail('not_found')
    refreshPanel()
    return ok()
  })
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  return asAdmin('admin.deleteMessage', async (repos) => {
    if (!validId(id)) return fail('validation')
    if (!(await repos.messages.remove(id))) return fail('not_found')
    refreshPanel()
    return ok()
  })
}

export async function setCommentStatus(id: string, status: CommentStatus): Promise<ActionResult> {
  return asAdmin('admin.setCommentStatus', async (repos) => {
    if (!validId(id) || !COMMENT_STATUSES.includes(status)) return fail('validation')
    if (!(await repos.comments.setStatus(id, status))) return fail('not_found')
    refreshPublicComments()
    return ok()
  })
}

export async function setCommentReply(id: string, text: string | null): Promise<ActionResult> {
  return asAdmin('admin.setCommentReply', async (repos) => {
    if (!validId(id)) return fail('validation')
    let reply: string | null = null
    if (text !== null) {
      const parsed = parseInput(replySchema, { text })
      if (!parsed.success) return fail('validation', { fieldErrors: parsed.fieldErrors })
      reply = parsed.data.text
    }
    if (!(await repos.comments.setReply(id, reply))) return fail('not_found')
    refreshPublicComments()
    return ok()
  })
}

export async function deleteComment(id: string): Promise<ActionResult> {
  return asAdmin('admin.deleteComment', async (repos) => {
    if (!validId(id)) return fail('validation')
    if (!(await repos.comments.remove(id))) return fail('not_found')
    refreshPublicComments()
    return ok()
  })
}
