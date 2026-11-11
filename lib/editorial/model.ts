import { z } from 'zod'

export const draftInput = z.object({
  id: z.string().uuid(),
  version: z.number().int().min(0),
  lang: z.enum(['es', 'en']),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().max(320),
  body: z.string().max(100_000),
  tags: z.array(z.string().trim().min(1).max(60)).max(12),
})

export type DraftInput = z.infer<typeof draftInput>
export type EditorialDraft = DraftInput & { createdAt: string; updatedAt: string }
export type SaveDraftResult = { ok: true; draft: EditorialDraft } | { ok: false; error: 'unauthorized' | 'validation' | 'conflict' | 'unavailable' }

export function exportDraft(draft: DraftInput): string {
  const metadata = { title: draft.title, description: draft.description, lang: draft.lang, tags: draft.tags, status: 'draft' }
  return `---\n${Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')}\n---\n\n${draft.body}\n`
}
