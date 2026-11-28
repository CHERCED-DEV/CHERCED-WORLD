import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { claudeBody } from '@/lib/ai/providers/claude'
import { openaiBody } from '@/lib/ai/providers/openai'
import { jsonSchemaOf, parseStructured, retryNote, toGeminiSchema } from '@/lib/ai/providers/schema'
import { fakeAdapter, testPort } from './support'

const answer = z.object({
  requisitos: z.array(z.object({ texto: z.string(), tipo: z.enum(['obligatorio', 'deseable']) })).min(1).max(8),
  modalidad: z.enum(['remoto', 'híbrido', 'presencial']).nullable(),
  nota: z.number().int().min(0).max(3),
})

const base = { model: 'x', task: 'balanced' as const, system: 'Responde JSON.', prompt: 'Extrae', schema: answer, schemaName: 'respuesta', maxOutputTokens: 1000, timeoutMs: 1000 }

describe('salida estructurada (FR-4304)', () => {
  it('el esquema Zod se vuelve JSON Schema', () => {
    const schema = jsonSchemaOf(answer)
    expect(schema).not.toHaveProperty('$schema')
    expect(schema).toMatchObject({ type: 'object', required: ['requisitos', 'modalidad', 'nota'] })
  })

  it('Gemini recibe el subconjunto OpenAPI con tipos en mayúscula, nullable y enum', () => {
    expect(toGeminiSchema(jsonSchemaOf(answer))).toEqual({
      type: 'OBJECT',
      properties: {
        requisitos: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: { texto: { type: 'STRING' }, tipo: { type: 'STRING', enum: ['obligatorio', 'deseable'] } },
            required: ['texto', 'tipo'],
            propertyOrdering: ['texto', 'tipo'],
          },
          minItems: 1,
          maxItems: 8,
        },
        modalidad: { type: 'STRING', enum: ['remoto', 'híbrido', 'presencial'], nullable: true },
        nota: { type: 'INTEGER', minimum: 0, maximum: 3 },
      },
      required: ['requisitos', 'modalidad', 'nota'],
      propertyOrdering: ['requisitos', 'modalidad', 'nota'],
    })
  })

  it('Claude recibe output_config.format json_schema con su objeto estricto', () => {
    const body = claudeBody(base, [{ role: 'user', content: 'Extrae' }])
    expect(body.output_config?.format).toMatchObject({ type: 'json_schema', schema: { type: 'object', additionalProperties: false } })
  })

  it('OpenAI recibe text.format json_schema estricto con nombre', () => {
    const body = openaiBody(base, 'Extrae')
    expect(body.text?.format).toMatchObject({ type: 'json_schema', name: 'respuesta', strict: true, schema: { type: 'object', additionalProperties: false } })
  })

  it('el servidor valida con Zod y explica por qué no pasa', () => {
    expect(parseStructured('{"requisitos":[{"texto":"TS","tipo":"obligatorio"}],"modalidad":null,"nota":2}', answer)).toMatchObject({ ok: true })
    expect(parseStructured('', answer)).toEqual({ ok: false, reason: 'la salida llegó vacía' })
    expect(parseStructured('{', answer)).toEqual({ ok: false, reason: 'la salida no es JSON' })
    const invalid = parseStructured('{"requisitos":[],"modalidad":"marte","nota":7}', answer)
    expect(invalid.ok).toBe(false)
    expect(!invalid.ok && invalid.reason).toMatch(/^no cumple el esquema \(requisitos: .*; modalidad: .*; nota: .*\)$/)
    expect(retryNote('la salida no es JSON')).toContain('solo con JSON')
  })

  it('reintenta una vez con el mismo proveedor y devuelve lo validado', async () => {
    const claude = fakeAdapter('claude', [{ text: '{"requisitos":[],"modalidad":null,"nota":1}' }, { text: '{"requisitos":[{"texto":"TS","tipo":"obligatorio"}],"modalidad":"remoto","nota":1}' }])
    const result = await testPort({ adapters: { claude } }).generateJson({ task: 'cheap', line: 'kb', system: 's', prompt: 'p', schema: answer })
    expect(claude.jsonCalls).toHaveLength(2)
    expect(result.data.modalidad).toBe('remoto')
    expect(result.attempts.filter((attempt) => attempt.provider === 'claude').map((attempt) => attempt.outcome)).toEqual(['invalid', 'ok'])
  })

  it('una salida cortada por maxOutputTokens queda marcada en el intento', async () => {
    const claude = fakeAdapter('claude', [{ text: '{"requisitos":[{"texto":"TS"', truncated: true }, { text: '{"requisitos":[{"texto":"TS","tipo":"deseable"}],"modalidad":null,"nota":0}' }])
    const result = await testPort({ adapters: { claude } }).generateJson({ task: 'cheap', line: 'kb', system: 's', prompt: 'p', schema: answer, maxOutputTokens: 64 })
    expect(claude.jsonCalls[0]!.maxOutputTokens).toBe(64)
    expect(result.attempts.find((attempt) => attempt.provider === 'claude')!.reason).toContain('salida cortada por maxOutputTokens')
  })
})
