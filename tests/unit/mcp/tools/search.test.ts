import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { callTool, ORIGIN, textOf } from '../support/rpc'
import { portfolioSetup } from '../support/setup'

const { portfolioMcp } = await import('@/lib/mcp/servers/portafolio')
const { buildSearchIndex } = await import('@/lib/search/build-index')

const indexes = { es: await buildSearchIndex('es'), en: await buildSearchIndex('en') }

beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})
const { searchOutput } = await import('@/lib/mcp/servers/portafolio/tools/search')
const { GLASS_FRAGMENT_MAX } = await import('@/lib/ailab/search/glassbox')

type Output = ReturnType<typeof searchOutput.parse>

describe('search_portfolio (FR-4404, FR-4405)', () => {
  it('«sagas» vuelve en Markdown con enlaces absolutos y el mismo resultado estructurado', async () => {
    const result = await callTool(portfolioMcp, 'search_portfolio', { query: 'sagas' })
    expect(result.isError).toBe(false)
    const output = searchOutput.parse(result.structuredContent) as Output
    expect(output.lang).toBe('en')
    expect(output.results.length).toBeGreaterThan(0)
    expect(output.results.length).toBeLessThanOrEqual(8)
    expect(output.results.map((item) => item.id)).toContain('project:12')
    const ids = new Set(indexes.en.docs.map((doc) => doc.id))
    for (const item of output.results) {
      expect(ids.has(item.id), item.id).toBe(true)
      expect(item.url.startsWith(`${ORIGIN}/en`)).toBe(true)
      expect(item.fragment.length).toBeLessThanOrEqual(GLASS_FRAGMENT_MAX)
      expect(textOf(result)).toContain(`](${item.url})`)
    }
    expect(output.results.map((item) => item.rank)).toEqual(output.results.map((_item, position) => position + 1))
  })

  it('respeta idioma, tipos y límite, con un máximo de 10', async () => {
    const es = searchOutput.parse((await callTool(portfolioMcp, 'search_portfolio', { query: 'arquitectura', lang: 'es', kinds: ['project'], limit: 3 })).structuredContent) as Output
    expect(es.lang).toBe('es')
    expect(es.results.length).toBeGreaterThan(0)
    expect(es.results.length).toBeLessThanOrEqual(3)
    for (const item of es.results) {
      expect(item.kind).toBe('project')
      expect(item.url.startsWith(`${ORIGIN}/es/portfolio/`)).toBe(true)
    }
    const many = searchOutput.parse((await callTool(portfolioMcp, 'search_portfolio', { query: 'a e i o u react angular net', limit: 10 })).structuredContent) as Output
    expect(many.results.length).toBeLessThanOrEqual(10)
  })

  it('sin resultados no es un error: dice que no hay nada y da dónde mirar', async () => {
    const result = await callTool(portfolioMcp, 'search_portfolio', { query: 'qwertyzxcv', lang: 'es' })
    expect(result.isError).toBe(false)
    const output = searchOutput.parse(result.structuredContent) as Output
    expect(output.results).toEqual([])
    expect(output.sources.map((item) => item.url)).toEqual([`${ORIGIN}/es/portfolio`, `${ORIGIN}/es/blog`])
    expect(textOf(result)).toMatch(/^No encontré nada publicado/)
  })

  it('valida la entrada: consulta vacía, límite de más o tipo que no existe dan isError', async () => {
    for (const args of [{ query: '   ' }, { query: 'x', limit: 11 }, { query: 'x', kinds: ['message'] }, { query: 'x'.repeat(201) }]) {
      const result = await callTool(portfolioMcp, 'search_portfolio', args)
      expect(result.isError, JSON.stringify(args).slice(0, 60)).toBe(true)
      expect(textOf(result)).toMatch(/^Invalid arguments for search_portfolio: /)
    }
  })

  it('no repite la consulta en la respuesta', async () => {
    const result = await callTool(portfolioMcp, 'search_portfolio', { query: 'zzqq-consulta-unica' })
    expect(JSON.stringify(result)).not.toContain('zzqq-consulta-unica')
  })
})