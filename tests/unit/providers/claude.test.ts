import { APIConnectionTimeoutError, BadRequestError, InternalServerError, RateLimitError } from '@anthropic-ai/sdk/core/error'
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/beta/messages/messages'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { claudeBody, claudeFailure, createClaudeAdapter, type ClaudeCreate } from '@/lib/ai/providers/claude'
import { ProviderCallError } from '@/lib/ai/providers/errors'
import { modelFor } from '@/lib/ai/providers/models'
import type { ModelTask } from '@/lib/ai/providers/types'
import { claudeRecorded } from './recorded'

const schema = z.object({ respuesta: z.string() })

function request(task: ModelTask) {
  return { model: modelFor('claude', task), task, system: 'Eres un extractor.', prompt: 'Hola', schema, schemaName: 'respuesta', maxOutputTokens: 1000, timeoutMs: 1000 }
}

function recording(reply: Parameters<typeof claudeRecorded>[0], usage?: Parameters<typeof claudeRecorded>[1]): { create: ClaudeCreate; bodies: MessageCreateParamsNonStreaming[] } {
  const bodies: MessageCreateParamsNonStreaming[] = []
  return { bodies, create: async (body) => (bodies.push(body), claudeRecorded(reply, usage)) }
}

describe('adaptador de Claude (FR-4307)', () => {
  it('no envía temperature y el esfuerzo va por tarea', () => {
    for (const [task, effort] of [['cheap', 'low'], ['balanced', 'medium'], ['strong', 'high']] as const) {
      const body = claudeBody(request(task), [{ role: 'user', content: 'Hola' }])
      expect(body).not.toHaveProperty('temperature')
      expect(body).not.toHaveProperty('thinking')
      expect(body.output_config?.effort).toBe(effort)
      expect(body.max_tokens).toBe(1000)
    }
  })

  it('activa el fallback del servidor solo en Opus 5.5 y Sonnet 5.5', () => {
    expect(claudeBody(request('balanced'), [])).toMatchObject({ model: 'claude-sonnet-5-5', fallbacks: 'default', betas: ['server-side-fallback-2026-07-01'] })
    expect(claudeBody(request('strong'), [])).toMatchObject({ model: 'claude-opus-5-5', fallbacks: 'default' })
    const haiku = claudeBody(request('cheap'), [])
    expect(haiku.model).toBe('claude-haiku-5-5')
    expect(haiku).not.toHaveProperty('fallbacks')
    expect(haiku).not.toHaveProperty('betas')
  })

  it('lee el texto y el modelo que de verdad respondió, no el pedido', async () => {
    const { create, bodies } = recording(
      {
        model: 'claude-sonnet-5',
        content: [
          { type: 'fallback', from: { model: 'claude-sonnet-5-5' }, to: { model: 'claude-sonnet-5' } } as never,
          { type: 'text', text: '{"respuesta":"hola"}', citations: null },
        ],
      },
      {
        input_tokens: 1500,
        output_tokens: 600,
        iterations: [
          { type: 'message', model: null, input_tokens: 1500, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cache_creation: null },
          { type: 'fallback_message', model: 'claude-sonnet-5', input_tokens: 1500, output_tokens: 600, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, cache_creation: null },
        ],
      },
    )
    const reply = await createClaudeAdapter(create).json(request('balanced'))
    expect(bodies[0]!.messages).toEqual([{ role: 'user', content: 'Hola' }])
    expect(reply).toMatchObject({ text: '{"respuesta":"hola"}', model: 'claude-sonnet-5', usage: { inputTokens: 1500, outputTokens: 600 }, truncated: false })
    expect(reply.costUsd).toBeCloseTo(0.003 + 0.009, 6)
  })

  it('el razonamiento se cobra como salida', async () => {
    const { create } = recording({ content: [{ type: 'thinking', thinking: '', signature: 'sig' } as never, { type: 'text', text: '{"respuesta":"x"}', citations: null }] }, { output_tokens: 2000, output_tokens_details: { thinking_tokens: 1400 } })
    const reply = await createClaudeAdapter(create).json(request('balanced'))
    expect(reply.usage.outputTokens).toBe(2000)
    expect(reply.costUsd).toBeCloseTo((1500 * 2 + 2000 * 10) / 1_000_000, 6)
  })

  it('revisa stop_reason antes de leer el contenido: un rechazo no es respuesta', async () => {
    const { create } = recording({ stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'cyber', explanation: null } as never, content: [{ type: 'text', text: '{"respuesta":"parcial"}', citations: null }] })
    const error = await createClaudeAdapter(create).json(request('balanced')).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ProviderCallError)
    expect(error).toMatchObject({ kind: 'refusal', message: 'Claude se negó a responder (cyber)' })
  })

  it('marca la salida cortada por max_tokens', async () => {
    const { create } = recording({ stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"respu', citations: null }] })
    expect((await createClaudeAdapter(create).json(request('cheap'))).truncated).toBe(true)
  })

  it('traduce los errores tipados del SDK para decidir el fallback', () => {
    const headers = new Headers()
    expect(claudeFailure(new RateLimitError(429, { type: 'error' }, 'rate limited', headers)).kind).toBe('rate_limit')
    expect(claudeFailure(new InternalServerError(529, { type: 'error' }, 'overloaded', headers)).kind).toBe('server')
    expect(claudeFailure(new BadRequestError(400, { type: 'error' }, 'bad request', headers)).kind).toBe('request')
    expect(claudeFailure(new APIConnectionTimeoutError()).kind).toBe('timeout')
  })
})
