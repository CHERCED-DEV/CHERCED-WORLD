'use server'

import type { PublicComment } from '@/lib/data/types'
import type { ActionResult } from './result'

export async function submitComment(_prev: ActionResult | null, _formData: FormData): Promise<ActionResult> {
  return { ok: false, error: 'unavailable' }
}

export async function getApprovedComments(_postId: string): Promise<PublicComment[]> {
  return []
}
