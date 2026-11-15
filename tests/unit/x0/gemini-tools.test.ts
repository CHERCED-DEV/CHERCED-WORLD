import { describe, expect, it } from 'vitest'
import { SIMULATOR_DIAGRAM } from '@/lib/ai/agent/design'
import { generateDiagram, simulateDiagram, TEXT_DIAGRAM_MAX_NODES, textDiagramSchema } from '@/lib/ai/diagram/generate'
import { sseTexts, streamText } from '@/lib/ai/generate'
import { isWriteTool, simulateWrite, WRITE_LIMITS, writeSystem } from '@/lib/ai/write/prompts'

const gemini = (text: string) => (async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }))) as typeof fetch

describe('texto → diagrama (026, A9)', () => {
  it('FR-2601: el esquema acepta hasta 40 nodos y rechaza referencias rotas', () => {
    const nodes = (n: number) => Array.from({ length: n }, (_, index) => ({ id: `n${index}`, etiqueta: `N${index}`, tipo: 'servicio' }))
    expect(textDiagramSchema.safeParse({ nodos: nodes(TEXT_DIAGRAM_MAX_NODES) }).success).toBe(true)
    expect(textDiagramSchema.safeParse({ nodos: nodes(TEXT_DIAGRAM_MAX_NODES + 1) }).success).toBe(false)
    expect(textDiagramSchema.safeParse({ nodos: nodes(2), conexiones: [{ de: 'n0', a: 'zz' }] }).success).toBe(false)
  })

  it('pide a Gemini el diagrama, con el actual si es un cambio, y lo valida', async () => {
    let body = ''
    const fetcher = (async (_url: unknown, init: RequestInit) => {
      body = String(init.body)
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(SIMULATOR_DIAGRAM) }] } }] }))
    }) as typeof fetch
    const diagram = await generateDiagram({ key: 'k', lang: 'es', prompt: 'agrega un caché', current: SIMULATOR_DIAGRAM }, fetcher)
    expect(diagram.nodos).toHaveLength(SIMULATOR_DIAGRAM.nodos.length)
    expect(body).toContain('Diagrama actual')
    await expect(generateDiagram({ key: 'k', lang: 'es', prompt: 'x', current: null }, gemini(JSON.stringify({ nodos: [] })))).rejects.toThrow()
  })

  it('el simulador devuelve un ejemplo y aplica un cambio visible', () => {
    expect(simulateDiagram(null)).toBe(SIMULATOR_DIAGRAM)
    expect(simulateDiagram(SIMULATOR_DIAGRAM).nodos).toHaveLength(SIMULATOR_DIAGRAM.nodos.length + 1)
  })
})

describe('de idea a spec, ADR y haiku (025, A7)', () => {
  it('FR-2503: límites de entrada por herramienta', () => {
    expect(WRITE_LIMITS).toEqual({ spec: 2000, adr: 2000, commit: 20000 })
    expect(isWriteTool('adr')).toBe(true)
    expect(isWriteTool('poema')).toBe(false)
  })

  it('cada herramienta lleva su estilo: Spec Kit, ADR con disparador y commit con haiku', () => {
    expect(writeSystem('spec', 'es')).toMatch(/FR-NNN01/)
    expect(writeSystem('adr', 'es')).toMatch(/Disparador de revisión/)
    expect(writeSystem('commit', 'en')).toMatch(/haiku/)
    expect(simulateWrite('commit', 'algo', 'es')).toMatch(/---/)
  })

  it('FR-2501: lee el streaming SSE de Gemini y suelta el texto por partes', async () => {
    expect(sseTexts('data: {"candidates":[{"content":{"parts":[{"text":"Hola"}]}}]}\n\ndata: basura\n')).toEqual(['Hola'])
    const sse = [
      'data: {"candidates":[{"content":{"parts":[{"text":"# spec"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":".md"}]}}]}\n\n',
    ].join('')
    const stream = await streamText({ key: 'k', model: 'm', system: 's', prompt: 'p' }, (async () => new Response(sse)) as typeof fetch)
    const text = await new Response(stream).text()
    expect(text).toBe('# spec.md')
  })
})
