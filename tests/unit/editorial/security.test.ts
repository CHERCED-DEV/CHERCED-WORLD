import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkdownPreview } from '@/components/admin/editorial/MarkdownPreview'
import { draftInput, exportDraft } from '@/lib/editorial/model'

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), saveDraft: vi.fn() }))
vi.mock('@/lib/auth/guard', () => ({ requireAdmin: mocks.requireAdmin, UnauthorizedError: class UnauthorizedError extends Error {} }))
vi.mock('@/lib/data/editorial', () => ({ saveDraft: mocks.saveDraft, DraftConflict: class DraftConflict extends Error {} }))
import { UnauthorizedError } from '@/lib/auth/guard'
import { DraftConflict } from '@/lib/data/editorial'
import { saveEditorialDraft } from '@/lib/actions/editorial'

const input = { id: 'a1993b3d-2fc0-4f8b-9dc4-a47c8df544cf', version: 0, lang: 'es' as const, title: 'Un borrador privado', description: '', body: 'Texto original', tags: ['arquitectura'] }

beforeEach(() => { vi.clearAllMocks(); mocks.requireAdmin.mockResolvedValue({}); mocks.saveDraft.mockResolvedValue({ ...input, version: 1 }) })

describe('editorial privado', () => {
  it('autoriza antes de validar o escribir', async () => {
    mocks.requireAdmin.mockRejectedValue(new UnauthorizedError())
    expect(await saveEditorialDraft(input)).toEqual({ ok: false, error: 'unauthorized' })
    expect(mocks.saveDraft).not.toHaveBeenCalled()
  })
  it('rechaza entradas inválidas sin escribir', async () => {
    expect(await saveEditorialDraft({ ...input, title: '', version: -1 })).toEqual({ ok: false, error: 'validation' })
    expect(mocks.saveDraft).not.toHaveBeenCalled()
    expect(draftInput.safeParse({ ...input, body: 'x'.repeat(100_001) }).success).toBe(false)
  })
  it('no oculta los conflictos de edición', async () => {
    mocks.saveDraft.mockRejectedValue(new DraftConflict())
    expect(await saveEditorialDraft(input)).toEqual({ ok: false, error: 'conflict' })
  })
  it('guarda una entrada válida con la versión devuelta por el repositorio', async () => {
    expect(await saveEditorialDraft(input)).toMatchObject({ ok: true, draft: { version: 1 } })
    expect(mocks.saveDraft).toHaveBeenCalledWith(input)
  })
  it('la vista previa escapa HTML, scripts y componentes', () => {
    const html = renderToStaticMarkup(createElement(MarkdownPreview, { body: '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n{process.env.SECRET}' }))
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img ')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('{process.env.SECRET}')
  })
  it('exporta el texto íntegro y deja claro que es un borrador', () => {
    const markdown = exportDraft({ ...input, body: '## Idea\n\nTexto <literal>\n```ts\nconst n = 1\n```' })
    expect(markdown).toContain('status: "draft"')
    expect(markdown).toContain('## Idea\n\nTexto <literal>\n```ts\nconst n = 1\n```')
  })
})
