import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { callTool, errorOf, freshIp, modernRequest, ORIGIN, resultOf, send, textOf } from '../support/rpc'
import { portfolioSetup } from '../support/setup'
import { VACANCIES_029 } from '../support/vacancies'

const { portfolioMcp } = await import('@/lib/mcp/servers/portafolio')
const { matchOutput } = await import('@/lib/mcp/servers/portafolio/tools/match')
const { buildSearchIndex } = await import('@/lib/search/build-index')
const { simulateMatch, vacancyLanguage } = await import('@/lib/ai/match/simulator')
const { VACANCY_MAX, VACANCY_MIN } = await import('@/lib/ai/match/config')
const { registerRepoFactory } = await import('@/lib/data')
const { createMemoryRepos } = await import('@/lib/data/memory')
const { RATE_LIMITS } = await import('@/lib/security/rate-limit')
const { JSONRPC_ERROR } = await import('@/lib/mcp/core/protocol')

const indexes = { es: await buildSearchIndex('es'), en: await buildSearchIndex('en') }

type Repos = ReturnType<typeof createMemoryRepos>

function recordingRepos() {
  const calls: Array<{ repo: string; method: string; args: unknown[] }> = []
  const base = createMemoryRepos()
  const wrap = (name: string, repo: object) =>
    new Proxy(repo, {
      get(target, property) {
        const value: unknown = Reflect.get(target, property)
        if (typeof value !== 'function') return value
        return (...args: unknown[]) => {
          calls.push({ repo: name, method: String(property), args })
          return (value as (...input: unknown[]) => unknown).apply(target, args)
        }
      },
    })
  const repos = Object.fromEntries(Object.entries(base).map(([name, repo]) => [name, wrap(name, repo as object)])) as unknown as Repos
  return { repos, calls }
}

beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('match_job_description sin gastar modelo (US3, FR-4404, SC-4405)', () => {
  it('menos de 80 o más de 8.000 caracteres da un error de validación con los límites', async () => {
    for (const text of ['corta', ' '.repeat(200) + 'x'.repeat(VACANCY_MIN - 1), 'x'.repeat(VACANCY_MAX + 1)]) {
      const result = await callTool(portfolioMcp, 'match_job_description', { text })
      expect(result.isError).toBe(true)
      expect(textOf(result)).toBe(`Invalid arguments for match_job_description: text: text must have between ${VACANCY_MIN} and ${VACANCY_MAX} characters after trimming.`)
    }
  })

  it('las cinco vacantes de la 029 dan la misma cobertura en tres corridas y cero ids inventados', async () => {
    for (const vacancy of VACANCIES_029) {
      const lang = vacancyLanguage(vacancy)
      const ids = new Set(indexes[lang].docs.map((doc) => doc.id))
      const runs = []
      for (let run = 0; run < 3; run += 1) runs.push(matchOutput.parse((await callTool(portfolioMcp, 'match_job_description', { text: vacancy })).structuredContent))
      expect(runs[1]).toEqual(runs[0])
      expect(runs[2]).toEqual(runs[0])
      const output = runs[0]!
      expect(output.mode).toBe('deterministic')
      expect(output.lang).toBe(lang)
      expect(output.coverage).toEqual(simulateMatch(vacancy, indexes[lang]).coverage)
      expect(output.requirements.length).toBeGreaterThanOrEqual(3)
      for (const item of output.requirements) {
        if (item.level === 'none') expect(item.evidence).toEqual([])
        else expect(item.evidence.length).toBeGreaterThan(0)
        for (const entry of item.evidence) {
          expect(ids.has(entry.id), entry.id).toBe(true)
          expect(entry.url.startsWith(`${ORIGIN}/${lang}/`)).toBe(true)
        }
      }
      expect(output.geminiAnalysis).toBe(`${ORIGIN}/${lang}/ai-lab#lab-a6`)
      expect(output.sources.at(-1)?.url).toBe(output.geminiAnalysis)
    }
  })

  it('dice la cobertura sin puntaje, que es determinista y dónde está el análisis con Gemini', async () => {
    const result = await callTool(portfolioMcp, 'match_job_description', { text: VACANCIES_029[0], lang: 'es' })
    const output = matchOutput.parse(result.structuredContent)
    const text = textOf(result)
    expect(text).toContain(`${output.coverage.covered} de ${output.coverage.total} requisitos con evidencia`)
    expect(text).toContain('Análisis determinista, sin modelo')
    expect(text).toContain(`El análisis con Gemini está en el AI Lab: ${ORIGIN}/es/ai-lab#lab-a6`)
    expect(text).not.toMatch(/\b\d{1,3}\s?%|score|puntaje:/i)
    expect(output).not.toHaveProperty('costUsd')
  })

  it('el texto de la vacante no queda guardado ni registrado en ningún lado (FR-2903)', async () => {
    const { repos, calls } = recordingRepos()
    registerRepoFactory(() => repos)
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => {}))
    const marker = 'Vacante-Marcada-Para-La-Prueba'
    const vacancy = `${marker}\n\nRequisitos:\n- Experiencia con React, Next.js y TypeScript\n- APIs en .NET y C#\n- Bases de datos MongoDB`
    const result = await callTool(portfolioMcp, 'match_job_description', { text: vacancy })
    expect(result.isError).toBe(false)
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(`${call.repo}.${call.method}`).toBe('rateLimits.hit')
      expect(JSON.stringify(call.args)).not.toContain(marker)
      expect(JSON.stringify(call.args)).not.toContain('MongoDB')
    }
    for (const spy of spies) for (const args of spy.mock.calls) expect(JSON.stringify(args)).not.toContain(marker)
  })

  it('tiene su propio límite por IP (mcpMatch): la llamada 11 en una hora recibe 429', async () => {
    const ip = freshIp()
    const request = () => modernRequest('tools/call', { name: 'match_job_description', arguments: { text: VACANCIES_029[2] } }, { ip })
    for (let i = 0; i < RATE_LIMITS.mcpMatch.limit; i += 1) expect(resultOf(await send(portfolioMcp, request())).isError).toBe(false)
    const blocked = await send(portfolioMcp, request())
    expect(blocked.status).toBe(429)
    expect(errorOf(blocked)).toMatchObject({ code: JSONRPC_ERROR.rateLimited, data: { scope: 'tool' } })
    expect(resultOf(await send(portfolioMcp, modernRequest('tools/call', { name: 'search_portfolio', arguments: { query: 'sagas' } }, { ip }))).isError).toBe(false)
  })
})