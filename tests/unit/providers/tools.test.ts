import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { claudeBody, claudeMessages, createClaudeAdapter } from '@/lib/ai/providers/claude'
import { createGeminiAdapter } from '@/lib/ai/providers/gemini'
import { geminiContents } from '@/lib/ai/providers/gemini-tools'
import { createOpenAIAdapter, openaiInput } from '@/lib/ai/providers/openai'
import type { PortMessage, PortTool } from '@/lib/ai/providers/types'
import { INVALID_ARGS_PREFIX } from '@/lib/ai/providers/tools'
import { claudeRecorded, geminiRecorded, jsonFetch, openaiMessage, openaiRecorded } from './recorded'
import { FAKE_KEYS, testPort } from './support'

const tools: PortTool[] = [
  { name: 'buscar_pedido', description: 'Busca un pedido por su id', inputSchema: z.object({ id: z.string().regex(/^P-\d{3}$/) }) },
  { name: 'crear_nota', description: 'Deja una nota en el pedido', inputSchema: z.object({ id: z.string(), texto: z.string().min(1) }) },
]

const final = z.object({ resumen: z.string() })

const ask: PortMessage[] = [{ role: 'user', text: '¿Dónde va el pedido P-104?' }]

const claudeCall = claudeRecorded({
  stop_reason: 'tool_use',
  content: [
    { type: 'thinking', thinking: '', signature: 'firma-claude' } as never,
    { type: 'text', text: 'Lo busco.', citations: null },
    { type: 'tool_use', id: 'toolu_01', name: 'buscar_pedido', input: { id: 'P-104' } },
  ],
})

const openaiCall = openaiRecorded({
  output: [
    { id: 'rs_1', type: 'reasoning', summary: [], encrypted_content: 'cifrado' } as never,
    { id: 'fc_1', type: 'function_call', call_id: 'call_1', name: 'buscar_pedido', arguments: '{"id":"P-104"}', status: 'completed' } as never,
  ],
})

const geminiCall = geminiRecorded([
  { thought: true, text: 'pienso', thoughtSignature: 'firma-gemini' },
  { functionCall: { name: 'buscar_pedido', args: { id: 'P-104' } } },
])

function ports() {
  const claudeBodies: MessageCreateParamsNonStreaming[] = []
  const openaiBodies: ResponseCreateParamsNonStreaming[] = []
  const geminiBodies: Array<{ url: string; body: Record<string, unknown> }> = []
  return {
    claudeBodies,
    openaiBodies,
    geminiBodies,
    claude: (replies: ReturnType<typeof claudeRecorded>[]) => createClaudeAdapter(async (body) => (claudeBodies.push(body), replies.shift()!)),
    openai: (replies: ReturnType<typeof openaiRecorded>[]) => createOpenAIAdapter(async (body) => (openaiBodies.push(body), replies.shift()!)),
    gemini: (replies: unknown[]) => createGeminiAdapter(FAKE_KEYS.gemini, jsonFetch(replies, geminiBodies)),
  }
}

const input = { task: 'balanced' as const, line: 'pyme' as const, system: 'Eres el agente de la pyme.', schema: final, messages: ask, tools }

describe('callTools con respuestas grabadas (FR-4319, SC-4309)', () => {
  it('los tres proveedores devuelven las mismas llamadas normalizadas para el mismo caso', async () => {
    const fakes = ports()
    const claude = await testPort({ adapters: { claude: fakes.claude([claudeCall]) } }).callTools({ ...input, prefer: 'claude' })
    const openai = await testPort({ adapters: { openai: fakes.openai([openaiCall]) } }).callTools({ ...input, prefer: 'openai' })
    const gemini = await testPort({ adapters: { gemini: fakes.gemini([geminiCall]) } }).callTools({ ...input, prefer: 'gemini' })
    for (const result of [claude, openai, gemini]) {
      expect(result.data).toBeNull()
      expect(result.toolCalls.map(({ name, args }) => ({ name, args }))).toEqual([{ name: 'buscar_pedido', args: { id: 'P-104' } }])
      expect(result.turn.role).toBe('assistant')
      expect(result.turn.native?.provider).toBe(result.provider)
    }
    expect(claude.toolCalls[0]!.id).toBe('toolu_01')
    expect(openai.toolCalls[0]!.id).toBe('call_1')
  })

  it('Claude: herramientas con strict, tool_choice automático y fallback del servidor', () => {
    const body = claudeBody({ ...input, model: 'claude-sonnet-5-5', schemaName: 'respuesta', maxOutputTokens: 1000, timeoutMs: 1000 }, claudeMessages(ask), tools)
    expect(body.tool_choice).toEqual({ type: 'auto' })
    expect(body.tools?.map((tool) => ('strict' in tool ? tool.strict : null))).toEqual([true, true])
    expect(body.tools?.[0]).toMatchObject({ name: 'buscar_pedido', input_schema: { type: 'object', additionalProperties: false } })
    expect(body).toMatchObject({ fallbacks: 'default' })
  })

  it('una llamada con argumentos inválidos vuelve al modelo como error una vez y nunca llega a quien llama', async () => {
    const fakes = ports()
    const bad = claudeRecorded({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'toolu_bad', name: 'buscar_pedido', input: { id: '104' } }] })
    const result = await testPort({ adapters: { claude: fakes.claude([bad, claudeCall]) } }).callTools({ ...input, prefer: 'claude' })
    expect(result.toolCalls.map((call) => call.args)).toEqual([{ id: 'P-104' }])
    expect(result.attempts.map((attempt) => attempt.outcome)).toEqual(['skipped', 'skipped', 'invalid', 'ok'])
    const repair = fakes.claudeBodies[1]!.messages.at(-1)!
    expect(repair.role).toBe('user')
    expect(JSON.stringify(repair.content)).toContain(INVALID_ARGS_PREFIX)
    expect(result.turn.native).toBeUndefined()
  })

  it('si el modelo repite la llamada inválida, cuenta como intento fallido y se pasa al siguiente', async () => {
    const fakes = ports()
    const bad = () => claudeRecorded({ stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'toolu_bad', name: 'buscar_pedido', input: { id: 'x' } }] })
    const result = await testPort({ adapters: { claude: fakes.claude([bad(), bad()]), openai: fakes.openai([openaiCall]) } }).callTools(input)
    expect(result.provider).toBe('openai')
    expect(result.toolCalls).toEqual([{ id: 'call_1', name: 'buscar_pedido', args: { id: 'P-104' } }])
    expect(result.attempts.filter((attempt) => attempt.provider === 'claude').map((attempt) => attempt.outcome)).toEqual(['invalid', 'invalid'])
  })

  it('native se reenvía sin cambios solo al mismo proveedor', () => {
    const history: PortMessage[] = [
      ...ask,
      { role: 'assistant', text: 'Lo busco.', toolCalls: [{ id: 'toolu_01', name: 'buscar_pedido', args: { id: 'P-104' } }], native: { provider: 'claude', model: 'claude-sonnet-5-5', content: claudeCall.content } },
      { role: 'tool', results: [{ callId: 'toolu_01', content: '{"estado":"en camino"}' }] },
    ]
    expect(claudeMessages(history)[1]).toEqual({ role: 'assistant', content: claudeCall.content })
    expect(JSON.stringify(claudeMessages(history))).toContain('firma-claude')
    const forOpenAI = openaiInput(history)
    expect(JSON.stringify(forOpenAI)).not.toContain('firma-claude')
    expect(forOpenAI).toEqual([
      { role: 'user', content: '¿Dónde va el pedido P-104?' },
      { role: 'assistant', content: 'Lo busco.' },
      { type: 'function_call', call_id: 'toolu_01', name: 'buscar_pedido', arguments: '{"id":"P-104"}' },
      { type: 'function_call_output', call_id: 'toolu_01', output: '{"estado":"en camino"}' },
    ])
    const forGemini = geminiContents(history)
    expect(JSON.stringify(forGemini)).not.toContain('firma-claude')
    expect(forGemini[2]).toEqual({ role: 'user', parts: [{ functionResponse: { name: 'buscar_pedido', response: { result: '{"estado":"en camino"}' } } }] })

    const geminiHistory: PortMessage[] = [...ask, { role: 'assistant', text: '', toolCalls: [{ id: 'call-gemini-1', name: 'buscar_pedido', args: { id: 'P-104' } }], native: { provider: 'gemini', model: 'gemini-3.8-flash', content: (geminiCall.candidates as Array<{ content: { parts: unknown[] } }>)[0]!.content.parts } }]
    expect(JSON.stringify(geminiContents(geminiHistory))).toContain('firma-gemini')
  })

  it('los resultados de llamadas en paralelo vuelven juntos en un solo mensaje', () => {
    const history: PortMessage[] = [
      ...ask,
      {
        role: 'assistant',
        text: '',
        toolCalls: [
          { id: 'toolu_a', name: 'buscar_pedido', args: { id: 'P-104' } },
          { id: 'toolu_b', name: 'crear_nota', args: { id: 'P-104', texto: 'cliente avisado' } },
        ],
      },
      { role: 'tool', results: [{ callId: 'toolu_a', content: 'en camino' }, { callId: 'toolu_b', content: 'nota creada', isError: false }] },
    ]
    const messages = claudeMessages(history)
    expect(messages).toHaveLength(3)
    expect(messages[2]).toEqual({
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'toolu_a', content: 'en camino' },
        { type: 'tool_result', tool_use_id: 'toolu_b', content: 'nota creada' },
      ],
    })
  })

  it('la respuesta final llega validada contra el esquema y sin llamadas', async () => {
    const fakes = ports()
    const answer = openaiRecorded({ output: [openaiMessage('{"resumen":"El pedido P-104 va en camino."}')] })
    const result = await testPort({ adapters: { openai: fakes.openai([answer]) } }).callTools({ ...input, prefer: 'openai' })
    expect(result).toMatchObject({ data: { resumen: 'El pedido P-104 va en camino.' }, toolCalls: [] })
    expect(fakes.openaiBodies[0]).toMatchObject({ tool_choice: 'auto', store: false, include: ['reasoning.encrypted_content'] })
    expect(fakes.openaiBodies[0]!.tools?.every((tool) => tool.type === 'function' && tool.strict === true)).toBe(true)
  })

  it('Gemini usa functionDeclarations con su propio pedido al mismo GEMINI_API_BASE', async () => {
    const fakes = ports()
    await testPort({ adapters: { gemini: fakes.gemini([geminiCall]) } }).callTools({ ...input, prefer: 'gemini' })
    const [call] = fakes.geminiBodies
    expect(call!.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent')
    expect(call!.body).toMatchObject({ tools: [{ functionDeclarations: [{ name: 'buscar_pedido' }, { name: 'crear_nota' }] }], toolConfig: { functionCallingConfig: { mode: 'AUTO' } } })
    expect(JSON.stringify(call!.body)).not.toContain(FAKE_KEYS.gemini)
  })
})
