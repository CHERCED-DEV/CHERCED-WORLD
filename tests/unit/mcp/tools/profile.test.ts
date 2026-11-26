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
const { careerOutput, postsOutput, skillsOutput } = await import('@/lib/mcp/servers/portafolio/tools/profile')

describe('get_career, get_skills y list_posts (FR-4404)', () => {
  it('la carrera publicada, la educación y los idiomas salen tal cual del índice', async () => {
    for (const lang of ['es', 'en'] as const) {
      const output = careerOutput.parse((await callTool(portfolioMcp, 'get_career', { lang })).structuredContent)
      const facts = indexes[lang].facts
      expect(output.published).toBe(facts.career.length > 0)
      expect(output.career).toEqual(facts.career)
      expect(output.education).toEqual(facts.education)
      expect(output.languages.map((item) => item.name)).toEqual(facts.languages.map((item) => item.name))
      expect(output.sources).toEqual([{ title: facts.pages.about.title, url: `${ORIGIN}/${lang}/aboutMe` }])
    }
  })

  it('las habilidades traen nivel, áreas con enlace y todas las tecnologías', async () => {
    const output = skillsOutput.parse((await callTool(portfolioMcp, 'get_skills', { lang: 'es' })).structuredContent)
    const facts = indexes.es.facts
    expect(output.skills.map((item) => item.id)).toEqual(facts.skills.tech.map((item) => item.id))
    expect(output.areas.map((item) => item.url)).toEqual(facts.skills.lobes.map((lobe) => `${ORIGIN}${lobe.url}`))
    expect(output.technologies).toEqual(facts.technologies)
  })

  it('los posts van del más nuevo al más viejo y se filtran por etiqueta sin importar tildes ni mayúsculas', async () => {
    const all = postsOutput.parse((await callTool(portfolioMcp, 'list_posts', { lang: 'es' })).structuredContent)
    expect(all.posts.map((post) => post.id)).toEqual(indexes.es.facts.posts.map((post) => post.id))
    expect([...all.posts.map((post) => post.date)].sort().reverse()).toEqual(all.posts.map((post) => post.date))
    const tag = all.tags[0]!
    const filtered = postsOutput.parse((await callTool(portfolioMcp, 'list_posts', { lang: 'es', tag: tag.toUpperCase() })).structuredContent)
    expect(filtered.posts.length).toBeGreaterThan(0)
    for (const post of filtered.posts) expect(post.tags).toContain(tag)
    const none = await callTool(portfolioMcp, 'list_posts', { lang: 'es', tag: 'qwertyzxcv' })
    expect(none.isError).toBe(false)
    expect(textOf(none)).toContain('No hay posts con esa etiqueta.')
    expect((postsOutput.parse(none.structuredContent)).posts).toEqual([])
  })
})