import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { highlightSection, readPageContext } from '@/lib/ai/agent/page-context'
import { greetFrom, intentOf, pageTitle, simulatorPageReply, simulatorReply } from '@/lib/ai/agent/simulator'
import { createToolRunner, HIGHLIGHT_TOOL, PAGE_TOOL } from '@/lib/ai/agent/tools'

type Fake = { id: string; tag: string; label?: string; heading?: string; inPanel?: boolean; attrs: Set<string>; scrolled: number }

function fakeDocument(items: Array<Omit<Fake, 'attrs' | 'scrolled'>>) {
  const elements = items.map((item) => ({ ...item, attrs: new Set<string>(), scrolled: 0 }))
  const node = (item: Fake) => ({
    id: item.id,
    matches: (selector: string) => selector.includes(item.tag),
    closest: (selector: string) => (selector.includes('data-cw-global-agent') && item.inPanel ? {} : null),
    getAttribute: (name: string) => (name === 'aria-label' ? (item.label ?? null) : null),
    querySelector: () => (item.heading ? { textContent: item.heading } : null),
    textContent: item.heading ?? '',
    scrollIntoView: () => {
      item.scrolled += 1
    },
    setAttribute: (name: string) => item.attrs.add(name),
    removeAttribute: (name: string) => item.attrs.delete(name),
  })
  const main = { querySelectorAll: () => elements.map(node) }
  const doc = {
    title: 'Caso 14',
    location: { pathname: '/es/portfolio/14' },
    body: main,
    querySelector: () => main,
    getElementById: (id: string) => {
      const item = elements.find((element) => element.id === id)
      return item ? node(item) : null
    },
  }
  return { doc: doc as unknown as Document, elements }
}

const SAMPLE = [
  { id: 'section-hero', tag: 'section', heading: 'Resumen' },
  { id: 'section-decisions', tag: 'section', label: 'Decisiones' },
  { id: 'bad id', tag: 'section', heading: 'Mal id' },
  { id: 'sin-texto', tag: 'h2' },
  { id: 'panel', tag: 'section', heading: 'Panel', inPanel: true },
]

describe('Mini Cherced en todo el sitio (028)', () => {
  it('lee la página actual: ruta, título y solo secciones con id válido, con nombre y fuera del panel', () => {
    const { doc } = fakeDocument(SAMPLE)
    expect(readPageContext(doc)).toEqual({
      path: '/es/portfolio/14',
      title: 'Caso 14',
      sections: [
        { id: 'section-hero', label: 'Resumen' },
        { id: 'section-decisions', label: 'Decisiones' },
      ],
    })
  })

  it('FR-2802: resalta solo ids que existen en la página y quita el resaltado después', () => {
    vi.useFakeTimers()
    const { doc, elements } = fakeDocument(SAMPLE)
    expect(highlightSection('section-decisions', doc, true)).toBe(true)
    expect(elements[1]!.attrs.has('data-cw-agent-highlight')).toBe(true)
    expect(elements[1]!.scrolled).toBe(1)
    vi.advanceTimersByTime(3000)
    expect(elements[1]!.attrs.has('data-cw-agent-highlight')).toBe(false)
    expect(highlightSection('panel', doc)).toBe(false)
    expect(highlightSection('no-existe', doc)).toBe(false)
    expect(highlightSection('<script>', doc)).toBe(false)
    vi.useRealTimers()
  })

  it('las herramientas responden sin página en el servidor y con página en el navegador', async () => {
    const { doc } = fakeDocument(SAMPLE)
    const index = async () => ({ version: 1, lang: 'es', docs: [], facts: {} }) as never
    const server = createToolRunner({ lang: 'es', index, navigate: () => {} })
    expect((await server({ id: '1', name: PAGE_TOOL, args: {} })).response.response.ok).toBe(false)
    const browser = createToolRunner({ lang: 'es', index, navigate: () => {}, page: { read: () => readPageContext(doc), highlight: (id) => highlightSection(id, doc, true) } })
    expect((await browser({ id: '2', name: PAGE_TOOL, args: {} })).response.response).toMatchObject({ ok: true, ruta: '/es/portfolio/14' })
    expect((await browser({ id: '3', name: HIGHLIGHT_TOOL, args: { id: 'section-hero' } })).response.response.ok).toBe(true)
    expect((await browser({ id: '4', name: HIGHLIGHT_TOOL, args: { id: 'nada' } })).response.response.ok).toBe(false)
  })

  it('el simulador entiende "esta página" y cuenta qué hay', () => {
    expect(intentOf('¿qué hay en esta página?')).toBe('page')
    expect(intentOf('where am i?')).toBe('page')
    expect(intentOf('lo mejor de esta web')).toBe('best')
    expect(pageTitle('Blog de arquitectura · Camilo Hernández')).toBe('Blog de arquitectura')
    const page = { path: '/es/blog', title: 'Blog · Camilo Hernández', sections: [{ id: 'a', label: 'Post 7' }, { id: 'b', label: 'Post 6' }] }
    expect(simulatorPageReply('es', page)).toBe('Estás en "Blog". Aquí hay "Post 7" y "Post 6". Te señalo "Post 7".')
    expect(simulatorPageReply('en', { ...page, sections: [] })).toMatch(/no sections/)
    expect(simulatorReply('es', 'qué hay en esta página', [], { author: 'C', about: '', services: { intro: '', items: [] }, projects: [], pages: {} as never }).open).toBeNull()
  })

  it('el chibi solo abre a Mini Cherced cuando el visitante toca "¿Hablamos?"', () => {
    const buddy = readFileSync(join(process.cwd(), 'components', 'fun', 'Buddy.tsx'), 'utf8')
    expect(buddy.match(/openMiniCherced/g)).toHaveLength(2)
    expect(buddy).toMatch(/data-cw-fun-talk=""\s+onClick=\{openMiniCherced\}/)
  })

  it('el saludo del panel global sabe desde qué página lo abrieron (prueba real del 2026-11-26)', () => {
    expect(greetFrom({ path: '/es/blog/post7', title: 'Un gate · Camilo Hernández' })).toBe('Dato de contexto: te abrieron desde la página «Un gate» (/es/blog/post7), no desde el AI Lab.')
    expect(greetFrom({ path: '/en/ai-lab', title: 'AI Lab' })).toMatch(/desde el AI Lab/)
  })
})
