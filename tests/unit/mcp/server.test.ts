import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { callTool, legacyRequest, modernRequest, resultOf, send, textOf } from './support/rpc'
import { portfolioSetup } from './support/setup'

const route = await import('@/app/api/mcp/route')
const { portfolioMcp, portfolioServer, PORTFOLIO_MCP_INSTRUCTIONS } = await import('@/lib/mcp/servers/portafolio')
const { openAiFetchOutput, openAiSearchOutput } = await import('@/lib/mcp/servers/portafolio/tools/openai')

const TOOLS = [
  'search_portfolio',
  'list_case_studies',
  'get_case_study',
  'get_decisions',
  'get_career',
  'get_skills',
  'list_posts',
  'match_job_description',
  'get_interview_route',
  'get_contact_options',
  'search',
  'fetch',
]

beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('servidor MCP del portafolio en /api/mcp (US1, FR-4401, FR-4404)', () => {
  it('la ruta corre en Node, es dinámica y solo exporta POST, GET, DELETE y OPTIONS', () => {
    expect(route.runtime).toBe('nodejs')
    expect(route.dynamic).toBe('force-dynamic')
    const source = readFileSync(join(process.cwd(), 'app/api/mcp/route.ts'), 'utf8')
    expect([...source.matchAll(/export function (\w+)/g)].map((match) => match[1])).toEqual(['POST', 'GET', 'DELETE', 'OPTIONS'])
    expect(route.GET().status).toBe(405)
    expect(route.OPTIONS().status).toBe(204)
  })

  it('publica las herramientas en inglés, en orden fijo, todas de solo lectura y con outputSchema', async () => {
    const tools = resultOf(await send(route, modernRequest('tools/list'))).tools as Array<Record<string, unknown>>
    expect(tools.map((tool) => tool.name)).toEqual(TOOLS)
    for (const tool of tools) {
      expect(tool.name).toMatch(/^[a-z_]+$/)
      expect((tool.annotations as Record<string, unknown>).readOnlyHint).toBe(true)
      expect(tool.outputSchema).toBeDefined()
      expect(String(tool.description).length).toBeGreaterThan(40)
    }
    expect(portfolioServer.tools.every((tool) => tool.readOnly === true)).toBe(true)
  })

  it('initialize con handshake da nombre, versión, tools, prompts e instrucciones breves en inglés', async () => {
    const result = resultOf(await send(route, legacyRequest('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'claude-code', version: '2' } }, { version: null })))
    expect(result).toMatchObject({
      protocolVersion: '2025-06-18',
      serverInfo: { name: 'cherced-world-portfolio', title: 'CHERCED-WORLD portfolio', version: '1.0.0' },
      capabilities: { tools: { listChanged: false }, prompts: { listChanged: false } },
      instructions: PORTFOLIO_MCP_INSTRUCTIONS,
    })
    expect(PORTFOLIO_MCP_INSTRUCTIONS.length).toBeLessThan(600)
    expect(PORTFOLIO_MCP_INSTRUCTIONS).toMatch(/^Read-only server/)
  })

  it('search y fetch tienen la forma que piden los conectores de ChatGPT (P-4404)', async () => {
    const search = await callTool(portfolioMcp, 'search', { query: 'decisiones de arquitectura en Synergos' })
    const found = openAiSearchOutput.parse(search.structuredContent)
    expect(Object.keys(search.structuredContent as object)).toEqual(['results'])
    expect(JSON.parse(textOf(search))).toEqual(search.structuredContent)
    expect(found.results[0]).toMatchObject({ id: 'es:project:12', title: 'Synergos' })
    for (const item of found.results) expect(Object.keys(item)).toEqual(['id', 'title', 'url'])

    const fetched = await callTool(portfolioMcp, 'fetch', { id: found.results[0]!.id })
    const doc = openAiFetchOutput.parse(fetched.structuredContent)
    expect(JSON.parse(textOf(fetched))).toEqual(fetched.structuredContent)
    expect(doc).toMatchObject({ id: 'es:project:12', title: 'Synergos', metadata: { kind: 'project', lang: 'es' } })
    expect(doc.text.length).toBeGreaterThan(500)

    expect(openAiSearchOutput.parse((await callTool(portfolioMcp, 'search', { query: 'architecture decisions' })).structuredContent).results[0]!.id).toMatch(/^en:/)
    expect(openAiFetchOutput.parse((await callTool(portfolioMcp, 'fetch', { id: 'project:12' })).structuredContent).metadata.lang).toBe('en')
    const missing = await callTool(portfolioMcp, 'fetch', { id: 'es:mensajes:1' })
    expect(missing.isError).toBe(true)
    expect(textOf(missing)).toBe('No existe un documento con ese id. Usa search para obtener ids válidos.')
  })

  it('un cliente que no usa prompts sigue funcionando igual', async () => {
    const result = await callTool(portfolioMcp, 'list_case_studies', {})
    expect(result.isError).toBe(false)
  })
})