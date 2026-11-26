import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { callTool, ORIGIN, resultOf, send, modernRequest } from '../support/rpc'
import { portfolioSetup } from '../support/setup'

const { createMcpHandler } = await import('@/lib/mcp/core/handler')
const { portfolioMcp, portfolioServer, portfolioToolList, ROUTE_STATIONS } = await import('@/lib/mcp/servers/portafolio')
const { routeOutput } = await import('@/lib/mcp/servers/portafolio/tools/route')
const { mcpStation } = await import('@/content/mcp/station')

const github = { ...mcpStation, id: 'doble-github', proof: 3 as const, alsoProves: undefined, href: 'https://github.com/CHERCED-DEV/CHERCED-WORLD', minutes: 1 }

beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('get_interview_route, con un doble de la ruta de la 042 (FR-4404)', () => {
  it('no aparece en tools/list mientras la ruta de la 042 no esté integrada', async () => {
    expect(ROUTE_STATIONS).toEqual([])
    const tools = resultOf(await send(portfolioMcp, modernRequest('tools/list'))).tools as Array<{ name: string }>
    expect(tools.map((tool) => tool.name)).not.toContain('get_interview_route')
  })

  it('con estaciones, va después del encaje y devuelve cada estación con su enlace en el idioma pedido', async () => {
    const tools = portfolioToolList([mcpStation, github])
    expect(tools.map((tool) => tool.name).indexOf('get_interview_route')).toBe(tools.map((tool) => tool.name).indexOf('match_job_description') + 1)
    const handler = createMcpHandler({ ...portfolioServer, tools })
    const output = routeOutput.parse((await callTool(handler, 'get_interview_route', { lang: 'es' })).structuredContent)
    expect(output.totalMinutes).toBe(mcpStation.minutes + 1)
    expect(output.stations[0]).toMatchObject({ id: 'mcp-en-tu-agente', proof: 1, alsoProves: [3], title: mcpStation.title.es, url: `${ORIGIN}/es/mcp`, evidence: ['mcp-call'], spec: '044' })
    expect(output.stations[1]!.url).toBe('https://github.com/CHERCED-DEV/CHERCED-WORLD')
    expect(output.sources).toEqual([{ title: mcpStation.title.es, url: `${ORIGIN}/es/mcp` }])
  })
})