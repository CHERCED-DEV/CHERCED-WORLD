'use server'

import { revalidatePath } from 'next/cache'
import type { PanelActor } from '@/lib/accounts/permissions'
import { requirePermission } from '@/lib/auth/accounts'
import { requireAdmin, UnauthorizedError } from '@/lib/auth/guard'
import { DraftConflict, DraftForbidden, getDraft, saveDraft, setDraftReview } from '@/lib/data/editorial'
import { publishPost, PublishingUnavailable, unpublishPost } from '@/lib/data/published'
import { canEditDraft, draftInput, reviewInput, type DraftAuthor, type ReviewResult, type SaveDraftResult } from '@/lib/editorial/model'
import { catalogTags, isPublishable, publishInput, summaryOf, unpublishInput, type PublishResult, type UnpublishResult } from '@/lib/editorial/published'
import { locales } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'

function guestOf(actor: PanelActor): DraftAuthor | null {
  return actor.kind === 'team' ? { id: actor.account.id, name: actor.account.name } : null
}

export async function saveEditorialDraft(input: unknown): Promise<SaveDraftResult> {
  try {
    const actor = await requirePermission('posts')
    const parsed = draftInput.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'validation' }
    const guest = guestOf(actor)
    return { ok: true, draft: await saveDraft(parsed.data, guest) }
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof DraftForbidden) return { ok: false, error: 'unauthorized' }
    if (error instanceof DraftConflict) return { ok: false, error: 'conflict' }
    logServerError('editorial.save', error)
    return { ok: false, error: 'unavailable' }
  }
}

export async function requestEditorialReview(input: unknown): Promise<ReviewResult> {
  try {
    const actor = await requirePermission('posts')
    const guest = guestOf(actor)
    const parsed = reviewInput.safeParse(input)
    if (!parsed.success || !guest) return { ok: false, error: 'validation' }
    const draft = await getDraft(parsed.data.id)
    if (!draft || !canEditDraft(draft, guest)) return { ok: false, error: 'unauthorized' }
    if (draft.version !== parsed.data.version) return { ok: false, error: 'conflict' }
    if (!isPublishable(draft)) return { ok: false, error: 'incomplete' }
    const updated = await setDraftReview(draft.id, { requestedAt: new Date().toISOString() })
    if (!updated) return { ok: false, error: 'conflict' }
    return { ok: true, draft: updated }
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: 'unauthorized' }
    logServerError('editorial.review', error)
    return { ok: false, error: 'unavailable' }
  }
}

function refreshBlog(): void {
  revalidatePath('/[lang]/blog', 'layout')
  for (const lang of locales) revalidatePath(`/${lang}/feed.xml`)
  revalidatePath('/sitemap.xml')
}

export async function publishEditorialDraft(input: unknown): Promise<PublishResult> {
  try {
    await requireAdmin()
    const parsed = publishInput.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'validation' }
    const draft = await getDraft(parsed.data.id)
    if (!draft || draft.version !== parsed.data.version) return { ok: false, error: 'conflict' }
    if (!isPublishable(draft)) return { ok: false, error: 'incomplete' }
    const post = await publishPost(draft, new Date())
    if (draft.review) await setDraftReview(draft.id, null)
    refreshBlog()
    return { ok: true, post: summaryOf(post), dropped: catalogTags(draft.tags, draft.lang).dropped }
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: 'unauthorized' }
    if (!(error instanceof PublishingUnavailable)) logServerError('editorial.publish', error)
    return { ok: false, error: 'unavailable' }
  }
}

export async function unpublishEditorialDraft(input: unknown): Promise<UnpublishResult> {
  try {
    await requireAdmin()
    const parsed = unpublishInput.safeParse(input)
    if (!parsed.success) return { ok: false, error: 'validation' }
    await unpublishPost(parsed.data.id)
    refreshBlog()
    return { ok: true }
  } catch (error) {
    if (error instanceof UnauthorizedError) return { ok: false, error: 'unauthorized' }
    if (!(error instanceof PublishingUnavailable)) logServerError('editorial.unpublish', error)
    return { ok: false, error: 'unavailable' }
  }
}
