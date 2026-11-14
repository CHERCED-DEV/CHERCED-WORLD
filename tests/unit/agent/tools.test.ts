import { describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { AGENT_TOOLS, createToolRunner, OPEN_TOOL, safeSitePath, SEARCH_TOOL, sitePaths } = await import('@/lib/ai/agent/tools')
const { buildSearchIndex } = await import('@/lib/search/build-index')

describe('herramientas del agente (FR-1804)', () => {
  it('declara solo buscar_en_el_sitio y abrir_pagina, con su parámetro obligatorio', () => {
    const declarations = AGENT_TOOLS[0].functionDeclarations
    expect(declarations.map((item) => item.name)).toEqual([SEARCH_TOOL, OPEN_TOOL])
    expect(declarations[0].parameters.required).toEqual(['consulta'])
    expect(declarations[1].parameters.required).toEqual(['ruta'])
  })

  it('abrir_pagina solo acepta rutas que existen en el sitio', async () => {
    const index = await buildSearchIndex('es')
    const paths = sitePaths(index)
    expect(paths.has('/es/portfolio')).toBe(true)
    expect(paths.has('/es/blog/post7')).toBe(true)
    expect(safeSitePath('/es/portfolio/12', index)).toBe('/es/portfolio/12')
    expect(safeSitePath('/es/blog/post7#indice', index)).toBe('/es/blog/post7#indice')
    expect(safeSitePath('https://cherced-world.vercel.app/es/ai-lab', index, 'https://cherced-world.vercel.app')).toBe('/es/ai-lab')
    for (const bad of ['/es/inbox', '/es/account', '//evil.example/x', 'https://evil.example/es/blog', 'javascript:alert(1)', '/es/no-existe', '', 42, null])
      expect(safeSitePath(bad, index), String(bad)).toBeNull()
    expect(safeSitePath('/es/blog#"><script>', index)).toBe('/es/blog')
  })

  it('buscar_en_el_sitio devuelve fragmentos públicos con título y ruta, y abrir_pagina navega', async () => {
    const index = await buildSearchIndex('es')
    const navigate = vi.fn()
    const run = createToolRunner({ lang: 'es', index: async () => index, navigate })
    const search = await run({ id: '1', name: SEARCH_TOOL, args: { consulta: 'Synergos' } })
    expect(search.response.id).toBe('1')
    const hits = (search.response.response as { resultados: Array<{ titulo: string; ruta: string; texto: string }> }).resultados
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(5)
    for (const hit of hits) {
      expect(hit.titulo).not.toBe('')
      expect(hit.texto.length).toBeLessThanOrEqual(600)
      expect(hit.ruta).not.toMatch(/\.pdf/i)
    }
    expect(search.effect).toMatchObject({ kind: 'search', query: 'Synergos' })

    const open = await run({ id: '2', name: OPEN_TOOL, args: { ruta: '/es/blog' } })
    expect(open.response.response).toEqual({ ok: true, ruta: '/es/blog' })
    expect(navigate).toHaveBeenCalledWith('/es/blog')

    const refused = await run({ id: '3', name: OPEN_TOOL, args: { ruta: '/es/inbox' } })
    expect(refused.response.response).toEqual({ ok: false, motivo: 'ruta_desconocida' })
    expect(navigate).toHaveBeenCalledTimes(1)

    const unknown = await run({ id: '4', name: 'borrar_todo', args: {} })
    expect(unknown.response.response).toEqual({ error: 'herramienta_desconocida' })
  })
})
