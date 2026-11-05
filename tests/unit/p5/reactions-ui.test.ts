import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { getDictionary } from '@/lib/i18n/server'

vi.mock('@/lib/actions/reactions', () => ({ toggleReaction: vi.fn() }))

const { Reactions } = await import('@/components/blog/reactions/Reactions')
const { reactionLabels, reactionName } = await import('@/components/blog/reactions/labels')
const { parseMarked, reactionsStorageKey, serializeMarked, toggled } = await import('@/components/blog/reactions/storage')

describe('reacción propia en el navegador', () => {
  it('la clave es cw-reactions:<postId>', () => {
    expect(reactionsStorageKey('post1')).toBe('cw-reactions:post1')
  })

  it('lee solo tipos válidos e ignora lo manipulado', () => {
    expect([...parseMarked('clap,fire')]).toEqual(['clap', 'fire'])
    expect([...parseMarked('heart,<b>,clap,clap')]).toEqual(['clap'])
    expect([...parseMarked('')]).toEqual([])
    expect([...parseMarked(null)]).toEqual([])
  })

  it('alternar marca y desmarca, y se guarda en orden estable', () => {
    const once = toggled(new Set(), 'fire')
    expect(serializeMarked(once)).toBe('fire')
    const twice = toggled(toggled(once, 'clap'), 'idea')
    expect(serializeMarked(twice)).toBe('clap,idea,fire')
    expect(serializeMarked(toggled(twice, 'idea'))).toBe('clap,fire')
  })
})

describe('Reactions', () => {
  it.each(['es', 'en'] as const)('en %s pinta tres botones con aria-pressed, deshabilitados hasta leer los contadores y ocultos sin JS', async (lang) => {
    const blog = await getDictionary(lang, 'blog')
    const labels = reactionLabels(blog)
    const html = renderToStaticMarkup(createElement(Reactions, { postId: 'post1', lang, labels }))
    expect(html).toContain('cw-js-only')
    expect(html).toContain(blog['reactions.title'])
    expect([...html.matchAll(/aria-pressed="false"/g)]).toHaveLength(3)
    expect([...html.matchAll(/<button[^>]*disabled=""/g)]).toHaveLength(3)
    for (const kind of ['clap', 'idea', 'fire']) expect(html).toContain(`data-cw-reaction="${kind}"`)
    expect(html).toContain(`aria-label="${reactionName(labels.count, labels.kinds[0]?.label ?? '', '–')}"`)
    expect(html).toContain('role="status"')
  })

  it('el nombre accesible junta reacción y contador', () => {
    expect(reactionName('{reaction}: {count}', 'Aplausos', '3')).toBe('Aplausos: 3')
  })
})
