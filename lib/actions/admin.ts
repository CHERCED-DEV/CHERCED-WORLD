'use server'

import type { CommentStatus, MessageStatus } from '@/lib/data/types'
import type { ActionResult } from './result'

export async function setMessageStatus(_id: string, _status: MessageStatus): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function deleteMessage(_id: string): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function setCommentStatus(_id: string, _status: CommentStatus): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function setCommentReply(_id: string, _text: string | null): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function deleteComment(_id: string): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}
