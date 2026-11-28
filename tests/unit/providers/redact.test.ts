import { APIError as AnthropicAPIError } from '@anthropic-ai/sdk/core/error'
import { AuthenticationError as OpenAIAuthenticationError } from 'openai/core/error'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { claudeFailure } from '@/lib/ai/providers/claude'
import { geminiFailure } from '@/lib/ai/providers/gemini-tools'
import { GeminiError } from '@/lib/ai/generate'
import { openaiFailure } from '@/lib/ai/providers/openai'
import { REDACTED_KEY, redactKeys, safeReason } from '@/lib/ai/providers/redact'
import { FAKE_KEYS, fakeAdapter, testPort } from './support'

const KEYS = Object.values(FAKE_KEYS)

describe('ninguna llave sale en un mensaje (FR-4310)', () => {
  it('borra las llaves falsas de los tres formatos y los tokens Bearer', () => {
    const text = `gemini ${FAKE_KEYS.gemini} vertex AQ.Ab8RN6FAKEFAKEFAKE claude ${FAKE_KEYS.claude} openai ${FAKE_KEYS.openai} viejo sk-FAKEFAKEFAKEFAKEFAKEFAKE Bearer abcdefghijklmnopqrstuv`
    const clean = redactKeys(text)
    for (const key of [...KEYS, 'AQ.Ab8RN6FAKEFAKEFAKE', 'sk-FAKEFAKEFAKEFAKEFAKEFAKE', 'abcdefghijklmnopqrstuv']) expect(clean).not.toContain(key)
    expect(clean.match(new RegExp(REDACTED_KEY.replace(/[[\]]/g, '\\$&'), 'g'))).toHaveLength(6)
    expect(redactKeys('sin llaves aquí')).toBe('sin llaves aquí')
  })

  it('el motivo se recorta a 200 caracteres', () => {
    expect(safeReason(new Error('x'.repeat(500)))).toHaveLength(200)
    expect(safeReason(null)).toBe('error desconocido')
  })

  it('los errores de los tres SDK salen sin la llave', () => {
    const claude = claudeFailure(new AnthropicAPIError(401, { type: 'error' }, `invalid x-api-key ${FAKE_KEYS.claude}`, new Headers()))
    const openai = openaiFailure(new OpenAIAuthenticationError(401, { message: 'bad key' }, `Incorrect API key provided: ${FAKE_KEYS.openai}`, new Headers()))
    const gemini = geminiFailure(new GeminiError(403, `API key not valid ${FAKE_KEYS.gemini}`))
    for (const error of [claude, openai, gemini]) {
      expect(error.kind).toBe('unavailable')
      for (const key of KEYS) expect(error.message).not.toContain(key)
    }
  })

  it('los intentos del puerto nunca traen la llave', async () => {
    const claude = fakeAdapter('claude', [{ fail: 'unavailable', message: `llave rechazada ${FAKE_KEYS.claude}` }])
    const openai = fakeAdapter('openai', [{ fail: 'server', message: `caído ${FAKE_KEYS.openai}` }])
    const gemini = fakeAdapter('gemini', [{ fail: 'rate_limit', message: `cuota ${FAKE_KEYS.gemini}` }])
    const error = await testPort({ adapters: { claude, openai, gemini } })
      .generateJson({ task: 'cheap', line: 'arena', system: 's', prompt: 'p', schema: z.object({ ok: z.boolean() }) })
      .catch((caught: unknown) => caught)
    const serialized = JSON.stringify(error) + String((error as Error).message)
    for (const key of KEYS) expect(serialized).not.toContain(key)
  })
})
