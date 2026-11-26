import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { errorOf, freshIp, legacyRequest, modernMeta, modernRequest, rawRequest, resultOf, send, MODERN, ENDPOINT } from './support/rpc'

const { createMcpHandler } = await import('@/lib/mcp/core/handler')
const { defineTool, McpToolError } = await import('@/lib/mcp/core/types')
const { JSONRPC_ERROR, LEGACY_PROTOCOL_VERSIONS, MAX_BODY_BYTES, SUPPORTED_PROTOCOL_VERSIONS } = await import('@/lib/mcp/core/protocol')
const { getRepos, registerRepoFactory } = await import('@/lib/data')
const { createMemoryRepos } = await import('@/lib/data/memory')
const { RATE_LIMITS, rateLimitKey } = await import('@/lib/security/rate-limit')

const SECRET = 'argumento-secreto-que-no-se-registra'

const sources = z.array(z.object({ title: z.string(), url: z.string() }))

const echo = defineTool({
  name: 'echo',
  title: 'Echo',
  description: 'Returns the text it receives.',
  readOnly: true,
  inputSchema: z.object({ text: z.string().min(1).max(40), lang: z.enum(['es', 'en']).optional() }),
  outputSchema: z.object({ text: z.string(), sources }),
  async handler({ text }, ctx) {
    const source = { title: 'Home', url: `${ctx.origin}/en` }
    return { text: `echo: ${text}`, structured: { text, sources: [source] }, sources: [source] }
  },
})

const refusing = defineTool({
  name: 'refusing',
  title: 'Refusing',
  description: 'Always refuses.',
  readOnly: true,
  inputSchema: z.object({}),
  async handler() {
    throw new McpToolError('No case study with that id.')
  },
})

const crashing = defineTool({
  name: 'crashing',
  title: 'Crashing',
  description: 'Always crashes.',
  readOnly: true,
  inputSchema: z.object({ text: z.string() }),
  async handler({ text }) {
    throw new Error(text)
  },
})

const sourceless = defineTool({
  name: 'sourceless',
  title: 'Sourceless',
  description: 'Forgets its sources.',
  readOnly: true,
  inputSchema: z.object({}),
  async handler() {
    return { text: 'nothing', sources: [] }
  },
})

const malformed = defineTool({
  name: 'malformed',
  title: 'Malformed',
  description: 'Breaks its output schema.',
  readOnly: true,
  inputSchema: z.object({}),
  outputSchema: z.object({ count: z.number() }),
  async handler(_args, ctx) {
    return { text: 'bad', structured: { count: 'many' } as unknown as { count: number }, sources: [{ title: 'Home', url: `${ctx.origin}/en` }] }
  },
})

const metered = defineTool({
  name: 'metered',
  title: 'Metered',
  description: 'Has its own limit.',
  readOnly: true,
  limit: 'mcpMatch',
  inputSchema: z.object({}),
  async handler(_args, ctx) {
    return { text: 'ok', sources: [{ title: 'Home', url: `${ctx.origin}/en` }] }
  },
})

const handler = createMcpHandler({
  name: 'test-server',
  title: 'Test server',
  version: '0.0.1',
  instructions: 'Test instructions.',
  tools: [echo, refusing, crashing, sourceless, malformed, metered],
  prompts: [
    {
      name: 'greet',
      title: 'Greet',
      description: 'Greets someone.',
      arguments: [{ name: 'who', description: 'Who to greet', required: true }],
      render: (args) => [{ role: 'user', text: `Say hello to ${args.who}.` }],
    },
  ],
  limits: { visitor: 'mcp', daily: 'mcpDaily' },
})

let logs: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('MONGODB_INTEGRAL_DB', '')
  registerRepoFactory(() => createMemoryRepos())
  logs = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('ciclo de vida y negociación de versión (FR-4402, FR-4403)', () => {
  it('initialize de un cliente con handshake devuelve la versión pedida, nombre, versión, capacidad tools e instrucciones', async () => {
    for (const version of LEGACY_PROTOCOL_VERSIONS) {
      const reply = await send(handler, legacyRequest('initialize', { protocolVersion: version, capabilities: {}, clientInfo: { name: 'x', version: '1' } }, { version: null }))
      expect(reply.status).toBe(200)
      const result = resultOf(reply)
      expect(result.protocolVersion).toBe(version)
      expect(result.serverInfo).toEqual({ name: 'test-server', title: 'Test server', version: '0.0.1' })
      expect(result.capabilities).toEqual({ tools: { listChanged: false }, prompts: { listChanged: false } })
      expect(result.instructions).toBe('Test instructions.')
      expect(result).not.toHaveProperty('resultType')
      expect(reply.headers.get('mcp-session-id')).toBeNull()
    }
  })

  it('una versión desconocida en initialize recibe la más reciente con handshake', async () => {
    const reply = await send(handler, legacyRequest('initialize', { protocolVersion: '2024-11-05', capabilities: {} }, { version: null }))
    expect(resultOf(reply).protocolVersion).toBe('2025-11-25')
  })

  it('server/discover anuncia las versiones, las capacidades, la identidad y la caché', async () => {
    const reply = await send(handler, modernRequest('server/discover'))
    expect(reply.status).toBe(200)
    const result = resultOf(reply)
    expect(result.resultType).toBe('complete')
    expect(result.supportedVersions).toEqual([...SUPPORTED_PROTOCOL_VERSIONS])
    expect(result.supportedVersions).toContain('2025-03-26')
    expect(result.capabilities).toEqual({ tools: { listChanged: false }, prompts: { listChanged: false } })
    expect(result._meta).toEqual({ 'io.modelcontextprotocol/serverInfo': { name: 'test-server', title: 'Test server', version: '0.0.1' } })
    expect(result.ttlMs).toBeGreaterThan(0)
    expect(result.cacheScope).toBe('public')
  })

  it('una versión que no existe en _meta da UnsupportedProtocolVersion con la lista', async () => {
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'mcp-protocol-version': '1900-01-01', 'mcp-method': 'tools/list', 'x-forwarded-for': freshIp() },
      body: JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/list', params: { _meta: modernMeta('1900-01-01') } }),
    })
    const reply = await send(handler, request)
    expect(reply.status).toBe(400)
    expect(errorOf(reply)).toEqual({
      code: JSONRPC_ERROR.unsupportedProtocolVersion,
      message: 'Unsupported protocol version',
      data: { supported: [...SUPPORTED_PROTOCOL_VERSIONS], requested: '1900-01-01' },
    })
    expect(reply.json?.id).toBe(7)
  })

  it('un cliente con handshake y una cabecera de versión desconocida recibe 400 con las versiones', async () => {
    const reply = await send(handler, legacyRequest('tools/list', {}, { version: '2024-11-05' }))
    expect(reply.status).toBe(400)
    expect(errorOf(reply).code).toBe(JSONRPC_ERROR.unsupportedProtocolVersion)
  })

  it('ping responde vacío con handshake y no existe en la revisión sin estado', async () => {
    expect(resultOf(await send(handler, legacyRequest('ping', undefined)))).toEqual({})
    const modern = await send(handler, modernRequest('ping'))
    expect(modern.status).toBe(404)
    expect(errorOf(modern).code).toBe(JSONRPC_ERROR.methodNotFound)
  })
})

describe('tools/list y tools/call (FR-4404, FR-4405)', () => {
  it('cada herramienta trae nombre, título, descripción, JSON Schema y readOnlyHint', async () => {
    const result = resultOf(await send(handler, modernRequest('tools/list')))
    const tools = result.tools as Array<Record<string, unknown>>
    expect(tools.map((tool) => tool.name)).toEqual(['echo', 'refusing', 'crashing', 'sourceless', 'malformed', 'metered'])
    for (const tool of tools) {
      expect(typeof tool.title).toBe('string')
      expect(typeof tool.description).toBe('string')
      expect((tool.inputSchema as Record<string, unknown>).type).toBe('object')
      expect(tool.inputSchema).not.toHaveProperty('$schema')
      expect(tool.annotations).toEqual({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false })
    }
    expect(tools[0]!.inputSchema).toMatchObject({ properties: { text: { type: 'string', minLength: 1, maxLength: 40 } }, required: ['text'] })
    expect(tools[0]!.outputSchema).toMatchObject({ type: 'object', required: ['text', 'sources'] })
    expect(result.resultType).toBe('complete')
    expect(result.cacheScope).toBe('public')
  })

  it('2025-03-26 no recibe outputSchema ni structuredContent; 2025-06-18 sí', async () => {
    const old = resultOf(await send(handler, legacyRequest('tools/list', {}, { version: null })))
    expect((old.tools as Array<Record<string, unknown>>)[0]).not.toHaveProperty('outputSchema')
    expect(old).not.toHaveProperty('ttlMs')
    const oldCall = resultOf(await send(handler, legacyRequest('tools/call', { name: 'echo', arguments: { text: 'hola' } }, { version: null })))
    expect(oldCall).toEqual({ content: [{ type: 'text', text: 'echo: hola' }], isError: false })
    const newer = resultOf(await send(handler, legacyRequest('tools/call', { name: 'echo', arguments: { text: 'hola' } }, { version: '2025-06-18' })))
    expect(newer.structuredContent).toEqual({ text: 'hola', sources: [{ title: 'Home', url: 'http://localhost:3142/en' }] })
  })

  it('una llamada válida devuelve texto, el resultado estructurado validado y la identidad del servidor', async () => {
    const reply = await send(handler, modernRequest('tools/call', { name: 'echo', arguments: { text: 'sagas' } }, { id: 'abc' }))
    expect(reply.status).toBe(200)
    expect(reply.json?.id).toBe('abc')
    const result = resultOf(reply)
    expect(result).toMatchObject({ resultType: 'complete', isError: false, content: [{ type: 'text', text: 'echo: sagas' }] })
    expect(result.structuredContent).toEqual({ text: 'sagas', sources: [{ title: 'Home', url: 'http://localhost:3142/en' }] })
    expect(result._meta).toEqual({ 'io.modelcontextprotocol/serverInfo': { name: 'test-server', title: 'Test server', version: '0.0.1' } })
  })

  it('argumentos inválidos vuelven como isError con el motivo, sin caerse', async () => {
    for (const args of [{}, { text: '' }, { text: 'x'.repeat(41) }, { text: 3 }, { text: 'ok', lang: 'fr' }]) {
      const result = resultOf(await send(handler, modernRequest('tools/call', { name: 'echo', arguments: args })))
      expect(result.isError).toBe(true)
      expect((result.content as Array<{ text: string }>)[0]!.text).toMatch(/^Invalid arguments for echo: /)
      expect(result).not.toHaveProperty('structuredContent')
    }
  })

  it('McpToolError da isError controlado; cualquier otra excepción da -32603 y se registra sin argumentos', async () => {
    const refused = resultOf(await send(handler, modernRequest('tools/call', { name: 'refusing', arguments: {} })))
    expect(refused).toMatchObject({ isError: true, content: [{ type: 'text', text: 'No case study with that id.' }] })
    const crashed = await send(handler, modernRequest('tools/call', { name: 'crashing', arguments: { text: SECRET } }))
    expect(crashed.status).toBe(200)
    expect(errorOf(crashed)).toEqual({ code: JSONRPC_ERROR.internal, message: 'Internal error' })
    expect(crashed.text).not.toContain(SECRET)
    expect(logs).toHaveBeenCalledWith('[CHERCED-WORLD] mcp.test-server.crashing: Error')
    for (const call of logs.mock.calls) expect(JSON.stringify(call)).not.toContain(SECRET)
  })

  it('un resultado sin fuentes o que rompe su outputSchema no sale: -32603', async () => {
    for (const name of ['sourceless', 'malformed']) {
      const reply = await send(handler, modernRequest('tools/call', { name, arguments: {} }))
      expect(errorOf(reply).code).toBe(JSONRPC_ERROR.internal)
    }
  })

  it('una herramienta que no existe o params mal formados dan -32602', async () => {
    const unknown = await send(handler, modernRequest('tools/call', { name: 'list_messages', arguments: {} }))
    expect(errorOf(unknown)).toMatchObject({ code: JSONRPC_ERROR.invalidParams, message: 'Unknown tool: list_messages' })
    expect((errorOf(unknown).data as { tools: string[] }).tools).toContain('echo')
    const malformedParams = await send(handler, modernRequest('tools/call', { name: 'echo', arguments: 'texto' }))
    expect(errorOf(malformedParams).code).toBe(JSONRPC_ERROR.invalidParams)
  })

  it('rpc en proceso lista las herramientas sin HTTP ni límites', async () => {
    const reply = await handler.rpc({ jsonrpc: '2.0', id: 'catalog', method: 'tools/list' })
    expect(reply && 'result' in reply ? (reply.result.tools as unknown[]).length : 0).toBe(6)
    expect(await getRepos().rateLimits.peek(rateLimitKey('mcpDaily', 'global'))).toBeNull()
    expect(await handler.rpc({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull()
  })
})

describe('prompts (FR-4402)', () => {
  it('prompts/list y prompts/get con la forma del protocolo', async () => {
    const list = resultOf(await send(handler, modernRequest('prompts/list')))
    expect(list.prompts).toEqual([{ name: 'greet', title: 'Greet', description: 'Greets someone.', arguments: [{ name: 'who', description: 'Who to greet', required: true }] }])
    const get = resultOf(await send(handler, modernRequest('prompts/get', { name: 'greet', arguments: { who: 'Ana' } })))
    expect(get.messages).toEqual([{ role: 'user', content: { type: 'text', text: 'Say hello to Ana.' } }])
    const missing = await send(handler, modernRequest('prompts/get', { name: 'greet', arguments: {} }))
    expect(errorOf(missing)).toMatchObject({ code: JSONRPC_ERROR.invalidParams, message: 'Missing required arguments: who' })
  })
})

describe('errores JSON-RPC y transporte (FR-4401, FR-4402, FR-4408)', () => {
  it('JSON mal formado: -32700 con 400', async () => {
    const reply = await send(handler, rawRequest('{"jsonrpc": "2.0", '))
    expect(reply.status).toBe(400)
    expect(reply.json).toEqual({ jsonrpc: '2.0', id: null, error: { code: JSONRPC_ERROR.parse, message: 'Parse error: the body is not valid JSON.' } })
  })

  it('petición inválida: -32600 con 400, conservando el id si se puede leer', async () => {
    for (const body of ['{"jsonrpc":"1.0","id":3,"method":"tools/list"}', '{"id":3,"method":"tools/list"}', '{"jsonrpc":"2.0","id":3}', '42', '"hola"', '{"jsonrpc":"2.0","id":null,"method":"x"}']) {
      const reply = await send(handler, rawRequest(body))
      expect(reply.status, body).toBe(400)
      expect(errorOf(reply).code, body).toBe(JSONRPC_ERROR.invalidRequest)
    }
    expect((await send(handler, rawRequest('{"jsonrpc":"1.0","id":3,"method":"x"}'))).json?.id).toBe(3)
  })

  it('método desconocido: -32601, 404 sin estado y 200 con handshake', async () => {
    const modern = await send(handler, modernRequest('resources/list'))
    expect(modern.status).toBe(404)
    expect(errorOf(modern)).toEqual({ code: JSONRPC_ERROR.methodNotFound, message: 'Method not found: resources/list' })
    const legacy = await send(handler, legacyRequest('resources/list', {}))
    expect(legacy.status).toBe(200)
    expect(errorOf(legacy).code).toBe(JSONRPC_ERROR.methodNotFound)
  })

  it('_meta sin capacidades del cliente: -32602 con 400', async () => {
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'mcp-protocol-version': MODERN, 'mcp-method': 'tools/list', 'x-forwarded-for': freshIp() },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { _meta: { 'io.modelcontextprotocol/protocolVersion': MODERN } } }),
    })
    const reply = await send(handler, request)
    expect(reply.status).toBe(400)
    expect(errorOf(reply).code).toBe(JSONRPC_ERROR.invalidParams)
  })

  it('cabeceras que faltan o no coinciden con el cuerpo: -32020 con 400; Mcp-Name en base64 vale', async () => {
    const cases: Array<[string, Record<string, unknown>, Record<string, string>]> = [
      ['tools/list', {}, { 'mcp-protocol-version': '' }],
      ['tools/list', {}, { 'mcp-method': 'tools/call' }],
      ['tools/call', { name: 'echo', arguments: { text: 'a' } }, { 'mcp-name': 'refusing' }],
    ]
    for (const [method, params, headers] of cases) {
      const request = modernRequest(method, params)
      const altered = new Headers(request.headers)
      for (const [key, value] of Object.entries(headers)) {
        if (value) altered.set(key, value)
        else altered.delete(key)
      }
      const reply = await send(handler, new Request(ENDPOINT, { method: 'POST', headers: altered, body: await request.text() }))
      expect(reply.status, JSON.stringify(headers)).toBe(400)
      expect(errorOf(reply).code).toBe(JSONRPC_ERROR.headerMismatch)
    }
    const missingName = modernRequest('tools/call', { name: 'echo', arguments: { text: 'a' } })
    const withoutName = new Headers(missingName.headers)
    withoutName.delete('mcp-name')
    expect((await send(handler, new Request(ENDPOINT, { method: 'POST', headers: withoutName, body: await missingName.text() }))).status).toBe(400)
    const encoded = modernRequest('tools/call', { name: 'echo', arguments: { text: 'a' } }, { headers: { 'mcp-name': `=?base64?${Buffer.from('echo').toString('base64')}?=` } })
    expect(resultOf(await send(handler, encoded)).isError).toBe(false)
  })

  it('una notificación responde 202 sin cuerpo', async () => {
    const reply = await send(handler, rawRequest(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })))
    expect(reply.status).toBe(202)
    expect(reply.text).toBe('')
    expect(await getRepos().rateLimits.peek(rateLimitKey('mcpDaily', 'global'))).toBeNull()
  })

  it('un lote se rechaza con un mensaje claro', async () => {
    const reply = await send(handler, rawRequest(JSON.stringify([{ jsonrpc: '2.0', id: 1, method: 'tools/list' }])))
    expect(reply.status).toBe(400)
    expect(errorOf(reply)).toEqual({ code: JSONRPC_ERROR.invalidRequest, message: 'Invalid Request: JSON-RPC batches are not supported. Send one message per POST.' })
  })

  it('GET y DELETE responden 405 con Allow: POST, OPTIONS', async () => {
    for (const response of [handler.GET(), handler.DELETE()]) {
      expect(response.status).toBe(405)
      expect(response.headers.get('allow')).toBe('POST, OPTIONS')
      expect(response.headers.get('access-control-allow-origin')).toBe('*')
    }
  })

  it('un cuerpo de más de 64 KB da 413, con Content-Length o sin él', async () => {
    const big = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: { pad: 'x'.repeat(MAX_BODY_BYTES) } })
    const declared = await send(handler, rawRequest(big, { 'content-length': String(big.length) }))
    expect(declared.status).toBe(413)
    expect(errorOf(declared).code).toBe(JSONRPC_ERROR.payloadTooLarge)
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunk = new TextEncoder().encode(big.slice(0, 16 * 1024))
        for (let i = 0; i < 6; i += 1) controller.enqueue(chunk)
        controller.close()
      },
    })
    const streamed = await send(handler, new Request(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half' } as RequestInit))
    expect(streamed.status).toBe(413)
  })

  it('OPTIONS abre CORS sin credenciales y toda respuesta es no-store', async () => {
    const preflight = handler.OPTIONS()
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get('access-control-allow-origin')).toBe('*')
    expect(preflight.headers.get('access-control-allow-credentials')).toBeNull()
    expect(preflight.headers.get('access-control-allow-methods')).toContain('POST')
    expect(preflight.headers.get('access-control-allow-headers')).toContain('mcp-protocol-version')
    const reply = await send(handler, modernRequest('tools/list', {}, { headers: { origin: 'https://inspector.example', cookie: 'cw-session=abc' } }))
    expect(reply.status).toBe(200)
    expect(reply.headers.get('cache-control')).toBe('no-store')
    expect(reply.headers.get('access-control-allow-origin')).toBe('*')
    expect(reply.headers.get('content-type')).toBe('application/json')
    expect(reply.headers.get('set-cookie')).toBeNull()
  })

  it('un Origin mal formado recibe 403', async () => {
    const reply = await send(handler, modernRequest('tools/list', {}, { headers: { origin: 'no es un origen' } }))
    expect(reply.status).toBe(403)
    expect(errorOf(reply).code).toBe(JSONRPC_ERROR.forbiddenOrigin)
  })
})

describe('límites por IP, por herramienta y global (FR-4407)', () => {
  it('la llamada 61 de una IP en 10 minutos recibe 429 con Retry-After y un error legible', async () => {
    const ip = freshIp()
    for (let i = 0; i < RATE_LIMITS.mcp.limit; i += 1) expect((await send(handler, modernRequest('tools/list', {}, { ip }))).status).toBe(200)
    const reply = await send(handler, modernRequest('tools/list', {}, { ip }))
    expect(reply.status).toBe(429)
    expect(Number(reply.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(errorOf(reply)).toMatchObject({ code: JSONRPC_ERROR.rateLimited, data: { scope: 'visitor' } })
    expect(errorOf(reply).message).toMatch(/^Rate limit exceeded \(visitor\)\. Try again in \d+ seconds\.$/)
    expect((await send(handler, modernRequest('tools/list'))).status).toBe(200)
  })

  it('el contador diario global suma cada petición en mcpDaily:global', async () => {
    for (let i = 0; i < 3; i += 1) await send(handler, modernRequest('tools/list'))
    await send(handler, legacyRequest('initialize', { protocolVersion: '2025-11-25', capabilities: {} }, { version: null }))
    expect((await getRepos().rateLimits.peek(rateLimitKey('mcpDaily', 'global')))?.count).toBe(4)
    expect(rateLimitKey('mcpDaily', 'global')).toBe('mcpDaily:global')
  })

  it('el tope diario y el de la herramienta también responden 429', async () => {
    const memory = createMemoryRepos()
    registerRepoFactory(() => ({
      ...memory,
      rateLimits: {
        ...memory.rateLimits,
        hit: async (key, rule, now) => (key.startsWith('mcpDaily:') ? { allowed: false, retryAfterMs: 90_000 } : memory.rateLimits.hit(key, rule, now)),
      },
    }))
    const daily = await send(handler, modernRequest('tools/list'))
    expect(daily.status).toBe(429)
    expect(daily.headers.get('retry-after')).toBe('90')
    expect(errorOf(daily)).toMatchObject({ data: { scope: 'daily', retryAfterSeconds: 90 } })

    registerRepoFactory(() => createMemoryRepos())
    const ip = freshIp()
    for (let i = 0; i < RATE_LIMITS.mcpMatch.limit; i += 1) expect(resultOf(await send(handler, modernRequest('tools/call', { name: 'metered', arguments: {} }, { ip }))).isError).toBe(false)
    const tool = await send(handler, modernRequest('tools/call', { name: 'metered', arguments: {} }, { ip }))
    expect(tool.status).toBe(429)
    expect(errorOf(tool)).toMatchObject({ data: { scope: 'tool' } })
  })

  it('si la base no responde, 503 en vez de servir sin límite', async () => {
    const memory = createMemoryRepos()
    registerRepoFactory(() => ({ ...memory, rateLimits: { ...memory.rateLimits, hit: async () => Promise.reject(new Error('mongo caído')) } }))
    const reply = await send(handler, modernRequest('tools/list'))
    expect(reply.status).toBe(503)
    expect(reply.headers.get('retry-after')).toBe('30')
    expect(errorOf(reply).code).toBe(JSONRPC_ERROR.unavailable)
  })
})