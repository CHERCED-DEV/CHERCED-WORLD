import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { callTool, ORIGIN, textOf } from './support/rpc'
import { portfolioSetup } from './support/setup'
import { VACANCIES_029 } from './support/vacancies'

const { portfolioMcp, portfolioServer } = await import('@/lib/mcp/servers/portafolio')
const { isSiteUrl, siteUrl, source, uniqueSources, withSources } = await import('@/lib/mcp/servers/portafolio/sources')
const { buildSearchIndex } = await import('@/lib/search/build-index')

const indexes = { es: await buildSearchIndex('es'), en: await buildSearchIndex('en') }

function knownPaths(): Set<string> {
  const paths = new Set<string>()
  for (const index of Object.values(indexes)) {
    for (const doc of index.docs) paths.add(doc.url.split('#')[0]!)
    for (const page of Object.values(index.facts.pages)) paths.add(page.url)
    for (const pdf of index.facts.cv?.pdfs ?? []) paths.add(pdf.href)
    paths.add(`/${index.lang}/ai-lab`)
    for (const page of ['/ai-lab/ruta', '/ai-lab/codigo', '/ai-lab/evals', '/mcp']) paths.add(`/${index.lang}${page}`)
  }
  return paths
}

const CALLS: Array<[string, Record<string, unknown>]> = [
  ['search_portfolio', { query: 'sagas' }],
  ['search_portfolio', { query: 'zzzz-no-existe', lang: 'es' }],
  ['list_case_studies', { lang: 'es' }],
  ['get_case_study', { id: '12', lang: 'en' }],
  ['get_decisions', { caseId: '12' }],
  ['get_decisions', { query: 'zzzz-no-existe' }],
  ['get_career', { lang: 'es' }],
  ['get_skills', { lang: 'en' }],
  ['list_posts', { lang: 'es' }],
  ['list_posts', { tag: 'zzzz-no-existe' }],
  ['get_contact_options', { lang: 'en' }],
  ['match_job_description', { text: VACANCIES_029[0] }],
  ['get_interview_route', { lang: 'es' }],
  ['search', { query: 'Synergos' }],
  ['fetch', { id: 'en:project:12' }],
]

beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('fuentes con URL absoluta y título (FR-4405)', () => {
  it('arma URLs absolutas del sitio y quita repetidas', () => {
    expect(siteUrl(ORIGIN, '/es/portfolio/12')).toBe(`${ORIGIN}/es/portfolio/12`)
    expect(source({ origin: ORIGIN }, 'Synergos', '/en/portfolio/12')).toEqual({ title: 'Synergos', url: `${ORIGIN}/en/portfolio/12` })
    expect(isSiteUrl(ORIGIN, `${ORIGIN}/en`)).toBe(true)
    expect(isSiteUrl(ORIGIN, 'https://github.com/CHERCED-DEV')).toBe(false)
    expect(isSiteUrl(ORIGIN, 'no es url')).toBe(false)
    expect(uniqueSources([{ title: 'a', url: 'u' }, { title: 'b', url: 'u' }])).toEqual([{ title: 'a', url: 'u' }])
    expect(withSources('es', 'Cuerpo', [{ title: 'Sobre [mí]', url: `${ORIGIN}/es/aboutMe` }])).toBe(`Cuerpo\n\n**Fuentes**\n- [Sobre mí](${ORIGIN}/es/aboutMe)`)
  })

  it('SC-4403: todo resultado que no es error trae al menos una fuente del sitio que existe', async () => {
    const paths = knownPaths()
    const covered = new Set<string>()
    for (const [name, args] of CALLS) {
      const result = await callTool(portfolioMcp, name, args)
      expect(result.isError, `${name} ${textOf(result)}`).toBe(false)
      covered.add(name)
      const structured = result.structuredContent as { sources?: Array<{ url: string }>; results?: Array<{ url: string }>; url?: string }
      const urls = structured.sources?.map((item) => item.url) ?? structured.results?.map((item) => item.url) ?? (structured.url ? [structured.url] : [])
      const fallback = urls.length > 0 ? urls : [...textOf(result).matchAll(/\]\((http[^)]+)\)/g)].map((match) => match[1]!)
      const site = fallback.filter((url) => isSiteUrl(ORIGIN, url))
      expect(site.length, name).toBeGreaterThan(0)
      for (const url of site) expect(paths.has(new URL(url).pathname), `${name}: ${url}`).toBe(true)
    }
    expect([...covered].sort()).toEqual(portfolioServer.tools.map((tool) => tool.name).sort())
  })

  it('el texto en Markdown lleva los enlaces de sus fuentes', async () => {
    const result = await callTool(portfolioMcp, 'get_case_study', { id: '12', lang: 'es' })
    expect(textOf(result)).toContain(`**Fuentes**\n- [Synergos](${ORIGIN}/es/portfolio/12)`)
  })
})