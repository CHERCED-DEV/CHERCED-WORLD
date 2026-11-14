import { describe, expect, it, vi } from 'vitest'
vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { AGENT_MODEL, AGENT_SESSION_MINUTES, AGENT_VOICE, isAgentGrant, isAgentStatus } = await import('@/lib/ai/agent/config')
const { agentInstruction, KNOWLEDGE_MAX_CHARS } = await import('@/lib/ai/agent/knowledge')
const { AUTH_TOKENS_URL, createLiveToken, LiveTokenError, liveTokenRequest } = await import('@/lib/ai/agent/session')
const { agentMode, geminiKey } = await import('@/lib/ai/gemini')

const NOW = new Date('2026-11-14T15:00:00.000Z')

describe('modo del agente (FR-1809)', () => {
  it('con la clave conversa con Gemini; sin ella, simulador en local y apagado en Vercel', () => {
    expect(geminiKey({ GEMINI_API_KEY: '  clave  ' })).toBe('clave')
    expect(geminiKey({ GEMINI_API_KEY: '   ' })).toBeNull()
    expect(agentMode({ GEMINI_API_KEY: 'clave', VERCEL: '1' })).toBe('live')
    expect(agentMode({})).toBe('local')
    expect(agentMode({ VERCEL: '1' })).toBe('off')
    expect(agentMode({ MONGODB_INTEGRAL_DB: 'mongodb://x' })).toBe('off')
  })

  it('reconoce las respuestas de la ruta', () => {
    expect(isAgentStatus({ mode: 'live' })).toBe(true)
    expect(isAgentStatus({ mode: 'otro' })).toBe(false)
    expect(isAgentGrant({ mode: 'live', token: 't', model: 'm', expiresAt: 'x' })).toBe(true)
    expect(isAgentGrant({ mode: 'live', token: 't' })).toBe(false)
  })
})

describe('token de un solo uso (FR-1806, FR-1807)', () => {
  it('fija modelo, voz, instrucción, herramientas y subtítulos, con un uso y vencimiento corto', () => {
    const body = liveTokenRequest('instrucción', NOW)
    expect(body.uses).toBe(1)
    expect(Date.parse(body.newSessionExpireTime) - NOW.getTime()).toBe(60_000)
    expect(Date.parse(body.expireTime) - NOW.getTime()).toBe(AGENT_SESSION_MINUTES * 60_000)
    const setup = body.bidiGenerateContentSetup as {
      model: string
      generationConfig: { responseModalities: string[]; speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: string } } } }
      systemInstruction: { parts: Array<{ text: string }> }
      tools: Array<{ functionDeclarations: Array<{ name: string }> }>
    }
    expect(setup.model).toBe(`models/${AGENT_MODEL}`)
    expect(setup.generationConfig.responseModalities).toEqual(['AUDIO'])
    expect(setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName).toBe(AGENT_VOICE)
    expect(setup.systemInstruction.parts[0]!.text).toBe('instrucción')
    expect(setup.tools[0]!.functionDeclarations.map((item) => item.name)).toEqual(['buscar_en_el_sitio', 'abrir_pagina'])
    expect(setup).toHaveProperty('inputAudioTranscription')
    expect(setup).toHaveProperty('outputAudioTranscription')
  })

  it('manda la clave solo en la cabecera y devuelve el nombre del token', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ name: 'auth_tokens/abc' }), { status: 200 }))
    const result = await createLiveToken('clave-secreta', 'instrucción', NOW, fetcher as unknown as typeof fetch)
    expect(result).toEqual({ token: 'auth_tokens/abc', expiresAt: liveTokenRequest('x', NOW).expireTime })
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe(AUTH_TOKENS_URL)
    expect(url).not.toContain('clave-secreta')
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('clave-secreta')
    expect(String(init.body)).not.toContain('clave-secreta')
  })

  it('si Google falla o no trae token, lanza un error sin la clave', async () => {
    const failing = vi.fn(async () => new Response('{"error":{"message":"API key not valid"}}', { status: 400 }))
    await expect(createLiveToken('clave-secreta', 'x', NOW, failing as unknown as typeof fetch)).rejects.toBeInstanceOf(LiveTokenError)
    const empty = vi.fn(async () => new Response('{}', { status: 200 }))
    const error = await createLiveToken('clave-secreta', 'x', NOW, empty as unknown as typeof fetch).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(LiveTokenError)
    expect(String((error as Error).message)).not.toContain('clave-secreta')
  })
})

describe('instrucción del agente (FR-1804, FR-1805)', () => {
  it('lleva el papel, el mapa del sitio y nada privado, sin pasarse del tope', async () => {
    for (const lang of ['es', 'en'] as const) {
      const text = await agentInstruction(lang)
      expect(text.length).toBeLessThanOrEqual(KNOWLEDGE_MAX_CHARS)
      expect(text).toContain('Mini Cherced')
      expect(text).toMatch(/eres una ia/i)
      expect(text).toContain('buscar_en_el_sitio')
      expect(text).toContain('abrir_pagina')
      expect(text).toContain(`/${lang}/portfolio`)
      expect(text).toContain(`/${lang}/blog/post7`)
      expect(text).toContain('Synergos')
      expect(text).not.toMatch(/mongodb|MONGODB_INTEGRAL_DB|GEMINI_API_KEY|GOOGLE_CLIENT_SECRET|\/inbox|@gmail\.com|@hotmail\.com/i)
    }
  })
})
