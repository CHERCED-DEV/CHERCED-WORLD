import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fake = vi.hoisted(() => ({ files: new Map<string, string>() }))
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(async (path: string) => {
    if (!fake.files.has(path)) throw Object.assign(new Error(), { code: 'ENOENT' })
    return fake.files.get(path)
  }),
  writeFile: vi.fn(async (path: string, value: string) => {
    fake.files.set(path, value)
  }),
  rename: vi.fn(async (source: string, target: string) => {
    fake.files.set(target, fake.files.get(source)!)
    fake.files.delete(source)
  }),
}))
vi.mock('@/lib/data/mongo/client', () => ({ mongoUri: () => null, getDb: vi.fn() }))

import { CodeBlock } from '@/components/blog/mdx/CodeBlock'
import { MdxH2, MdxH3 } from '@/components/blog/mdx/Heading'
import { markdownBlocks, markdownContent, renderMarkdown, safeHref } from '@/components/blog/mdx/markdown'
import { preparePost } from '@/components/blog/mdx/prepare'
import { proxy } from '@/proxy'
import { postIds } from '@/lib/content'
import { listPublished, publishPost, unpublishPost } from '@/lib/data/published'
import type { EditorialDraft } from '@/lib/editorial/model'
import { catalogTags, isPublishable, isPublishedId, publishedId, publishedMeta, publishedSlug } from '@/lib/editorial/published'
import { NextRequest } from 'next/server'

const draft: EditorialDraft = {
  id: 'a1993b3d-2fc0-4f8b-9dc4-a47c8df544cf',
  version: 3,
  lang: 'es',
  title: 'Mi primer artículo: ¿qué aprendí con Ñandú?',
  description: 'Una idea corta.',
  body: '## Contexto\n\nTexto **fuerte** y *suave*.\n\n```ts\nconst a = 1\n```\n',
  tags: ['arquitectura', 'etiqueta inventada', 'Arquitectura'],
  createdAt: '2026-11-12T10:00:00.000Z',
  updatedAt: '2026-11-12T10:00:00.000Z',
}

function types(node: ReactNode): unknown[] {
  return (Array.isArray(node) ? node : [node]).filter(isValidElement).map((element) => (element as ReactElement).type)
}

beforeEach(() => {
  vi.stubEnv('VERCEL', '')
  fake.files.clear()
})

describe('016: ids y slugs de lo publicado desde el panel', () => {
  it('el id lleva p- y un slug ASCII de hasta 60 caracteres, sin chocar con el registro ni con otro publicado', () => {
    expect(publishedSlug('Mi primer artículo: ¿qué aprendí con Ñandú?')).toBe('mi-primer-articulo-que-aprendi-con-nandu')
    expect(publishedSlug('!!!')).toBe('articulo')
    expect(publishedSlug('a'.repeat(80))).toHaveLength(60)
    expect(publishedId('Hola mundo', new Set())).toBe('p-hola-mundo')
    expect(publishedId('Hola mundo', new Set(['p-hola-mundo']))).toBe('p-hola-mundo-2')
    expect(isPublishedId('p-hola-mundo')).toBe(true)
    for (const id of [...postIds(), 'no-existe', 'p-', 'p--x', 'p-Hola', `p-${'a'.repeat(61)}`]) expect(isPublishedId(id), id).toBe(false)
  })

  it('solo publica etiquetas del catálogo, en el idioma del post y sin repetir', () => {
    expect(catalogTags(draft.tags, 'es')).toEqual({ kept: ['arquitectura'], dropped: ['etiqueta inventada'] })
    expect(catalogTags(['architecture'], 'es').kept).toEqual(['arquitectura'])
  })

  it('pide título, descripción y contenido para publicar', () => {
    expect(isPublishable(draft)).toBe(true)
    expect(isPublishable({ ...draft, description: '  ' })).toBe(false)
    expect(isPublishable({ ...draft, body: '' })).toBe(false)
  })

  it('el post publicado usa la portada generada y su propia imagen para redes', () => {
    const meta = publishedMeta({ ...draft, author: undefined, id: 'p-x', draftId: draft.id, tags: ['arquitectura'], date: '2026-11-12', publishedAt: '', updatedAt: '' })
    expect(meta.cover).toBe('generated')
    expect(meta.image.src).toBe('/es/blog/p-x/opengraph-image/og')
    expect(meta.author).toBe('Camilo Hernández')
  })
})

describe('016: Markdown seguro con los componentes del blog', () => {
  it('títulos, código, citas, listas y separadores salen con los mismos componentes que los posts del repo', () => {
    const blocks = markdownBlocks('# Uno\n\n### Dos\n\n- a\n- b\n\n1. c\n\n> cita\n\n---\n\n```js\nx\n```')
    expect(blocks.map((block) => block.kind)).toEqual(['heading', 'heading', 'list', 'list', 'quote', 'rule', 'code'])
    expect(types(renderMarkdown('## A\n\n### B\n\n```\nx\n```'))).toEqual([MdxH2, MdxH3, CodeBlock])
  })

  it('no ejecuta HTML ni acepta enlaces peligrosos', () => {
    const html = renderToStaticMarkup(createElement('div', null, renderMarkdown('<script>alert(1)</script> [mal](javascript:alert) [bien](https://example.com) [aquí](/es/blog)')))
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toMatch(/href="javascript/i)
    expect(html).toContain('mal')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('href="/es/blog"')
    for (const bad of ['javascript:x', '//evil.com', 'data:text/html,x', 'vbscript:x']) expect(safeHref(bad), bad).toBeNull()
  })

  it('negrita, cursiva y código en línea, sin romper palabras con guion bajo', () => {
    const html = renderToStaticMarkup(createElement('p', null, renderMarkdown('**a** *b* `c` snake_case_name')))
    expect(html).toContain('<strong>a</strong>')
    expect(html).toContain('<em>b</em>')
    expect(html).toContain('<code>c</code>')
    expect(html).toContain('snake_case_name')
  })

  it('el índice y el tiempo de lectura funcionan igual que en los posts del repo', () => {
    const prepared = preparePost(markdownContent('## Primera parte\n\nUno dos tres.\n\n## Segunda parte\n\nCuatro.'), {
      code: { copy: 'Copiar', copied: 'Copiado', copyError: 'No se pudo copiar' },
      glassDemo: {} as never,
    })
    expect(prepared.headings.map((heading) => heading.text)).toEqual(['Primera parte', 'Segunda parte'])
    expect(prepared.minutes).toBeGreaterThanOrEqual(1)
  })
})

describe('016: guardar, actualizar y despublicar', () => {
  it('publicar crea el post con fecha; actualizar conserva id y fecha; despublicar lo quita', async () => {
    const first = await publishPost(draft, new Date('2026-11-12T12:00:00Z'))
    expect(first.id).toBe('p-mi-primer-articulo-que-aprendi-con-nandu')
    expect(first.date).toBe('2026-11-12')
    expect(first.tags).toEqual(['arquitectura'])
    const again = await publishPost({ ...draft, title: 'Otro título', body: 'Nuevo' }, new Date('2026-11-14T12:00:00Z'))
    expect(again.id).toBe(first.id)
    expect(again.date).toBe('2026-11-12')
    expect(again.updated).toBe('2026-11-14')
    expect(again.title).toBe('Otro título')
    expect(await listPublished()).toHaveLength(1)
    expect((await unpublishPost(draft.id))?.id).toBe(first.id)
    expect(await listPublished()).toEqual([])
  })

  it('en Vercel sin base no finge publicar', async () => {
    vi.stubEnv('VERCEL', '1')
    await expect(publishPost(draft, new Date())).rejects.toThrow()
    expect(await listPublished()).toEqual([])
  })
})

describe('016: el proxy deja pasar los p- y sigue mandando al 404 lo demás', () => {
  it('p-… se reescribe a la página interna con el id en una cabecera; lo demás no cambia', () => {
    const rewritten = (url: string) => proxy(new NextRequest(url)).headers.get('x-middleware-rewrite') ?? ''
    expect(rewritten('https://cherced.test/es/blog/p-mi-post')).toMatch(/\/es\/blog\/publicado$/)
    expect(proxy(new NextRequest('https://cherced.test/es/blog/p-mi-post')).headers.get('x-middleware-request-x-cw-published-id')).toBe('p-mi-post')
    expect(rewritten('https://cherced.test/es/blog/publicado')).toContain('__missing-content')
    expect(rewritten('https://cherced.test/es/blog/no-existe')).toContain('__missing-content')
    expect(rewritten('https://cherced.test/es/blog/post1')).toBe('')
    const spoofed = new NextRequest('https://cherced.test/es/blog/post1', { headers: { 'x-cw-published-id': 'p-otro' } })
    expect(proxy(spoofed).headers.get('x-middleware-request-x-cw-published-id')).toBeNull()
  })
})
