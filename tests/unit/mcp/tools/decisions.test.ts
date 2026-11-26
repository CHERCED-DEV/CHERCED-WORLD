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
const { decisionsOutput, DECISIONS_MAX } = await import('@/lib/mcp/servers/portafolio/tools/decisions')

describe('get_decisions (FR-4404)', () => {
  it('sin filtro trae las tarjetas con por qué y qué se sacrificó, hasta el tope', async () => {
    const output = decisionsOutput.parse((await callTool(portfolioMcp, 'get_decisions', {})).structuredContent)
    const total = indexes.en.facts.projects.reduce((sum, project) => sum + project.adrs.length, 0)
    expect(output.total).toBe(total)
    expect(output.decisions.length).toBe(Math.min(total, DECISIONS_MAX))
    for (const item of output.decisions) {
      expect(item.id).toMatch(/^decision:[\w-]+-\d+$/)
      expect(item.why.length).toBeGreaterThan(0)
      expect(item.tradeoff.length).toBeGreaterThan(0)
      expect(item.url).toBe(`${ORIGIN}/en/portfolio/${item.caseId}`)
    }
  })

  it('por caso devuelve las de ese caso, en orden', async () => {
    const output = decisionsOutput.parse((await callTool(portfolioMcp, 'get_decisions', { caseId: '12', lang: 'es' })).structuredContent)
    const fact = indexes.es.facts.projects.find((project) => project.id === '12')!
    expect(output.decisions.map((item) => item.decision)).toEqual(fact.adrs.map((item) => item.decision))
    expect(output.decisions.map((item) => item.id)).toEqual(fact.adrs.map((_item, position) => `decision:12-${position + 1}`))
  })

  it('por texto encuentra la decisión que lo menciona', async () => {
    const output = decisionsOutput.parse((await callTool(portfolioMcp, 'get_decisions', { query: 'compensation' })).structuredContent)
    expect(output.decisions[0]?.decision).toMatch(/Compensation/)
    const none = decisionsOutput.parse((await callTool(portfolioMcp, 'get_decisions', { query: 'qwertyzxcv' })).structuredContent)
    expect(none.decisions).toEqual([])
    expect(none.sources).toEqual([{ title: indexes.en.facts.pages.portfolio.title, url: `${ORIGIN}/en/portfolio` }])
  })

  it('un caso que no existe da isError', async () => {
    const result = await callTool(portfolioMcp, 'get_decisions', { caseId: '999' })
    expect(result.isError).toBe(true)
    expect(textOf(result)).toMatch(/^There is no case study with that id\. Valid ids: /)
  })
})