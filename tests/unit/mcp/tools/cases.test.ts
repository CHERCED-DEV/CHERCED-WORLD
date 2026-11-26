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
const { caseStudyOutput, listCasesOutput } = await import('@/lib/mcp/servers/portafolio/tools/cases')
const { approvedPitch, casePitches } = await import('@/content/pitches')

describe('list_case_studies y get_case_study (FR-4404)', () => {
  it('lista todos los casos con su id, enlace y si tienen pitch aprobado', async () => {
    const output = listCasesOutput.parse((await callTool(portfolioMcp, 'list_case_studies', { lang: 'es' })).structuredContent)
    expect(output.cases.map((item) => item.id)).toEqual(indexes.es.facts.projects.map((project) => project.id))
    for (const item of output.cases) {
      expect(item.url).toBe(`${ORIGIN}/es/portfolio/${item.id}`)
      expect(item.hasPitch).toBe(approvedPitch(item.id) !== undefined)
    }
    expect(output.sources[0]).toEqual({ title: indexes.es.facts.pages.portfolio.title, url: `${ORIGIN}/es/portfolio` })
  })

  it('Synergos trae problema, decisiones con por qué y costo, stack, resultados, enlaces y el pitch aprobado', async () => {
    for (const lang of ['es', 'en'] as const) {
      const result = await callTool(portfolioMcp, 'get_case_study', { id: '12', lang })
      const output = caseStudyOutput.parse(result.structuredContent)
      const fact = indexes[lang].facts.projects.find((project) => project.id === '12')!
      expect(output).toMatchObject({ id: '12', title: fact.title, context: fact.context, result: fact.result, technologies: fact.technologies, url: `${ORIGIN}/${lang}/portfolio/12` })
      expect(output.adrs).toEqual(fact.adrs)
      expect(output.adrs.length).toBeGreaterThan(0)
      expect(output.pitch).toBe(approvedPitch('12')!.script[lang])
      expect(output.links.repos.length).toBeGreaterThan(0)
      expect(textOf(result)).toContain(fact.adrs[0]!.tradeoff)
    }
  })

  it('el pitch sale solo si está aprobado', async () => {
    for (const project of indexes.en.facts.projects) {
      const output = caseStudyOutput.parse((await callTool(portfolioMcp, 'get_case_study', { id: project.id })).structuredContent)
      expect(output.pitch, project.id).toBe(casePitches.find((pitch) => pitch.caseId === project.id && pitch.approved)?.script.en ?? null)
    }
  })

  it('un id que no existe da isError con los ids válidos y sin repetir lo que se pidió', async () => {
    for (const id of ['999', '../../privado', 'MONGODB_INTEGRAL_DB', '12; drop']) {
      const result = await callTool(portfolioMcp, 'get_case_study', { id, lang: 'es' })
      expect(result.isError).toBe(true)
      expect(textOf(result)).toBe(`No existe un caso con ese id. Ids válidos: ${indexes.es.facts.projects.map((project) => project.id).join(', ')}.`)
    }
  })
})