import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})
import { errorOf, modernRequest, resultOf, send } from './support/rpc'
import { portfolioSetup } from './support/setup'

const { portfolioMcp } = await import('@/lib/mcp/servers/portafolio')
const { JSONRPC_ERROR } = await import('@/lib/mcp/core/protocol')

type Messages = Array<{ role: string; content: { type: string; text: string } }>

beforeEach(portfolioSetup)

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('prompts interview_camilo y fit_for_role (US4, FR-4402)', () => {
  it('prompts/list los muestra con su descripción y sus argumentos', async () => {
    const result = resultOf(await send(portfolioMcp, modernRequest('prompts/list')))
    expect(result.prompts).toEqual([
      {
        name: 'interview_camilo',
        title: 'Interview Camilo',
        description: expect.any(String),
        arguments: [{ name: 'lang', description: expect.any(String), required: false }],
      },
      {
        name: 'fit_for_role',
        title: 'Fit for a role',
        description: expect.any(String),
        arguments: [
          { name: 'job_description', description: expect.any(String), required: true },
          { name: 'lang', description: expect.any(String), required: false },
        ],
      },
    ])
  })

  it('interview_camilo arma cinco preguntas en el idioma pedido que se responden con las herramientas', async () => {
    for (const [lang, word] of [['es', 'Cita cada afirmación'], ['en', 'Cite every claim'], [undefined, 'Cite every claim']] as const) {
      const result = resultOf(await send(portfolioMcp, modernRequest('prompts/get', { name: 'interview_camilo', arguments: lang ? { lang } : {} })))
      const messages = result.messages as Messages
      expect(messages).toHaveLength(1)
      expect(messages[0]!.role).toBe('user')
      const text = messages[0]!.content.text
      expect(text).toContain(word)
      expect(text.match(/^\d\. /gm)).toHaveLength(5)
      for (const tool of ['get_case_study', 'get_decisions', 'search_portfolio', 'list_posts']) expect(text).toContain(tool)
    }
  })

  it('fit_for_role pide la vacante y la pasa a match_job_description', async () => {
    const missing = await send(portfolioMcp, modernRequest('prompts/get', { name: 'fit_for_role', arguments: { job_description: '   ' } }))
    expect(errorOf(missing)).toEqual({ code: JSONRPC_ERROR.invalidParams, message: 'Missing required arguments: job_description' })
    const result = resultOf(await send(portfolioMcp, modernRequest('prompts/get', { name: 'fit_for_role', arguments: { job_description: 'Senior Angular developer\n- Angular', lang: 'es' } })))
    const text = (result.messages as Messages)[0]!.content.text
    expect(text).toMatch(/^Llama a match_job_description/)
    expect(text).toContain('Senior Angular developer\n- Angular')
  })
})