import { describe, expect, it, vi } from 'vitest'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { INTERVIEW_TRACKS, interviewTracks, isInterviewTrack } = await import('@/content/ailab/interview')
const { interviewActa, interviewBlock, interviewExchanges } = await import('@/lib/ai/agent/interview')
const { AGENT_TOOLS, SOURCE_TOOL, createToolRunner } = await import('@/lib/ai/agent/tools')
const { agentInstruction } = await import('@/lib/ai/agent/knowledge')
const { buildSearchIndex } = await import('@/lib/search/build-index')

describe('modo entrevista (030)', () => {
  it('FR-3001: tres pistas con su banco de preguntas en ES y EN', () => {
    for (const lang of ['es', 'en'] as const)
      for (const track of INTERVIEW_TRACKS) {
        const content = interviewTracks[lang][track]
        expect(content.ready, `${lang} ${track}`).toBe(true)
        expect(content.questions.length, `${lang} ${track}`).toBe(track === 'design' ? 6 : 8)
      }
    expect(isInterviewTrack('behavioral')).toBe(true)
    expect(isInterviewTrack('trampa')).toBe(false)
  })

  it('la instrucción pide STAR, fuentes en pantalla y nada inventado, solo en el modo entrevista', async () => {
    const block = interviewBlock('behavioral', 'Camilo')
    expect(block).toMatch(/STAR/)
    expect(block).toContain(SOURCE_TOOL)
    expect(block).toMatch(/Nunca inventes/)
    expect(await agentInstruction('es', undefined, undefined, 'technical')).toMatch(/# Modo entrevista: Técnica/)
    expect(await agentInstruction('es')).not.toMatch(/# Modo entrevista/)
    const names = AGENT_TOOLS[0].functionDeclarations.map((tool) => tool.name)
    expect(names).toContain(SOURCE_TOOL)
  })

  it('FR-3002: mostrar_fuente acepta solo rutas del índice y devuelve su título', async () => {
    const run = createToolRunner({ lang: 'es', index: () => buildSearchIndex('es'), navigate: () => {} })
    const ok = await run({ id: '1', name: SOURCE_TOOL, args: { ruta: '/es/synergos' } })
    expect(ok.response.response.ok).toBe(true)
    expect(ok.effect).toMatchObject({ kind: 'source', path: '/es/synergos' })
    const bad = await run({ id: '2', name: SOURCE_TOOL, args: { ruta: '/es/no-existe' } })
    expect(bad.response.response.ok).toBe(false)
    expect(bad.effect).toBeNull()
  })

  it('FR-3003: el acta trae fecha, pista, duración, preguntas con su respuesta y fuentes sin repetir', () => {
    const turns = [
      { id: 1, who: 'agent' as const, text: '¡Pa!', done: true },
      { id: 2, who: 'you' as const, text: '¿Por qué micro-frontends?', done: true },
      { id: 3, who: 'agent' as const, text: 'Porque', done: true },
      { id: 4, who: 'agent' as const, text: 'cada vertical despliega solo.', done: true },
      { id: 5, who: 'you' as const, text: '¿Y las sagas?', done: true },
    ]
    expect(interviewExchanges(turns)).toEqual([
      { question: '¿Por qué micro-frontends?', answer: 'Porque cada vertical despliega solo.' },
      { question: '¿Y las sagas?', answer: '' },
    ])
    const acta = interviewActa({
      lang: 'es',
      track: 'technical',
      startedAt: Date.parse('2026-11-15T15:00:00Z'),
      endedAt: Date.parse('2026-11-15T15:04:05Z'),
      turns,
      sources: [
        { path: '/es/synergos', title: 'Synergos' },
        { path: '/es/synergos', title: 'Synergos' },
      ],
      origin: 'https://ejemplo.test',
    })
    expect(acta).toMatch(/^# Acta de entrevista con Mini Cherced/)
    expect(acta).toContain('**Pista:** Técnica')
    expect(acta).toContain('**Duración:** 04:05')
    expect(acta).toContain('### 1. ¿Por qué micro-frontends?')
    expect(acta).toContain('(sin respuesta)')
    expect(acta.match(/\[Synergos\]\(https:\/\/ejemplo\.test\/es\/synergos\)/g)).toHaveLength(1)
  })
})
