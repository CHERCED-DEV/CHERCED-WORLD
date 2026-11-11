'use server'

import { requireAdmin, UnauthorizedError } from '@/lib/auth/guard'
import { DraftConflict, saveDraft } from '@/lib/data/editorial'
import { draftInput, type SaveDraftResult } from '@/lib/editorial/model'
import { logServerError } from '@/lib/security/log'

export async function saveEditorialDraft(input: unknown): Promise<SaveDraftResult> {
  try {
    await requireAdmin()
    const parsed = draftInput.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'validation' }
    return { ok: true, draft: await saveDraft(parsed.data) }
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: 'unauthorized' }
    if (error instanceof DraftConflict) return { ok: false, error: 'conflict' }
    logServerError('editorial.save', error)
    return { ok: false, error: 'unavailable' }
  }
}
