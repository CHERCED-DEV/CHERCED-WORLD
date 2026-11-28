import { APIConnectionTimeoutError, BadRequestError, InternalServerError, RateLimitError } from 'openai/core/error'
import type { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { ProviderCallError } from '@/lib/ai/providers/errors'
import { modelFor } from '@/lib/ai/providers/models'
import { createOpenAIAdapter, openaiBody, openaiFailure, type OpenAICreate } from '@/lib/ai/providers/openai'
import type { ModelTask } from '@/lib/ai/providers/types'
import { openaiMessage, openaiRecorded } from './recorded'

const schema = z.object({ respuesta: z.string() })

function request(task: ModelTask) {
  return { model: modelFor('openai', task), task, system: 'Eres un extractor.', prompt: 'Hola', schema, schemaName: 'respuesta', maxOutputTokens: 1000, timeoutMs: 1000 }
}

function recording(reply: Parameters<typeof openaiRecorded>[0]): { create: OpenAICreate; bodies: ResponseCreateParamsNonStreaming[] } {
  const bodies: ResponseCreateParamsNonStreaming[] = []
  return { bodies, create: async (body) => (bodies.push(body), openaiRecorded(reply)) }
}

describe('adaptador de OpenAI (FR-4302, Responses API del SDK instalado)', () => {
  it('manda instrucciones, esfuerzo por tarea, formato estricto y no guarda la conversación', () => {
    for (const [task, effort, model] of [['cheap', 'low', 'gpt-6-luna'], ['balanced', 'medium', 'gpt-6.2-sol'], ['strong', 'high', 'gpt-6.2-astra']] as const) {
      const body = openaiBody(request(task), 'Hola')
      expect(body).toMatchObject({ model, instructions: 'Eres un extractor.', input: 'Hola', max_output_tokens: 1000, reasoning: { effort }, store: false })
      expect(body).not.toHaveProperty('temperature')
      expect(body.text?.format).toMatchObject({ type: 'json_schema', strict: true })
    }
  })

  it('lee solo la respuesta final, con el modelo real y su costo', async () => {
    const { create } = recording({ model: 'gpt-6.2-sol-2026-06-01', output: [openaiMessage('pensando…', 'commentary'), openaiMessage('{"respuesta":"hola"}')] })
    const reply = await createOpenAIAdapter(create).json(request('balanced'))
    expect(reply).toMatchObject({ text: '{"respuesta":"hola"}', model: 'gpt-6.2-sol-2026-06-01', usage: { inputTokens: 1500, outputTokens: 600 }, truncated: false })
    expect(reply.costUsd).toBeCloseTo(0.009, 6)
  })

  it('un rechazo o un filtro de contenido no se lee como respuesta', async () => {
    const refusal = recording({ output: [{ id: 'msg_1', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'refusal', refusal: 'No puedo ayudar con eso.' }] } as never] })
    await expect(createOpenAIAdapter(refusal.create).json(request('cheap'))).rejects.toMatchObject({ kind: 'refusal' })
    const filtered = recording({ status: 'incomplete', incomplete_details: { reason: 'content_filter' }, output: [] })
    await expect(createOpenAIAdapter(filtered.create).json(request('cheap'))).rejects.toMatchObject({ kind: 'refusal' })
  })

  it('marca la salida cortada y trata una respuesta fallida como error del servidor', async () => {
    const cut = recording({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, output: [openaiMessage('{"resp')] })
    expect((await createOpenAIAdapter(cut.create).json(request('cheap'))).truncated).toBe(true)
    const failed = recording({ status: 'failed', error: { code: 'server_error', message: 'boom' } as never, output: [] })
    const error = await createOpenAIAdapter(failed.create).json(request('cheap')).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(ProviderCallError)
    expect(error).toMatchObject({ kind: 'server' })
  })

  it('traduce los errores tipados del SDK para decidir el fallback', () => {
    const headers = new Headers()
    expect(openaiFailure(new RateLimitError(429, { message: 'slow down' }, 'rate limited', headers)).kind).toBe('rate_limit')
    expect(openaiFailure(new InternalServerError(503, { message: 'down' }, 'down', headers)).kind).toBe('server')
    expect(openaiFailure(new BadRequestError(400, { message: 'bad' }, 'bad request', headers)).kind).toBe('request')
    expect(openaiFailure(new APIConnectionTimeoutError()).kind).toBe('timeout')
  })
})
