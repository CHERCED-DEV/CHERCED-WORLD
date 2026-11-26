import 'server-only'
import type { Locale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { getSiteUrl } from '@/lib/site-url'
import { checkServerLimits, checkToolLimit, McpLimitUnavailableError, type LimitVerdict } from './limit'
import {
  decodeHeaderValue,
  DISCOVER_TTL_MS,
  HEADERLESS_LEGACY_VERSION,
  isLegacyVersion,
  isModernVersion,
  JSONRPC_ERROR,
  jsonRpcMessageSchema,
  LATEST_PROTOCOL_VERSION,
  LIST_TTL_MS,
  MAX_BODY_BYTES,
  MCP_HEADERS,
  META_KEYS,
  NAMED_METHODS,
  negotiateLegacyVersion,
  promptGetParamsSchema,
  SUPPORTED_PROTOCOL_VERSIONS,
  supportsStructuredContent,
  toolCallParamsSchema,
  type JsonRpcError,
  type JsonRpcErrorCode,
  type JsonRpcId,
  type JsonRpcMessage,
  type JsonRpcResponse,
  type ProtocolEra,
  type ProtocolVersion,
} from './protocol'
import { describeIssues, inputJsonSchema, outputJsonSchema, type JsonSchema } from './schema'
import { McpToolError, type McpContext, type McpPrompt, type McpServerOptions, type McpTool } from './types'

export type McpToolAnnotations = { readOnlyHint: true; destructiveHint: false; idempotentHint: true; openWorldHint: false }

export type McpToolDescriptor = {
  name: string
  title: string
  description: string
  inputSchema: JsonSchema
  outputSchema?: JsonSchema
  annotations: McpToolAnnotations
}

export type McpPromptDescriptor = Pick<McpPrompt, 'name' | 'title' | 'description' | 'arguments'>

export type McpRpcOptions = { origin?: string; version?: ProtocolVersion }

export type McpHandler = {
  POST(request: Request): Promise<Response>
  GET(): Response
  DELETE(): Response
  OPTIONS(): Response
  rpc(message: unknown, options?: McpRpcOptions): Promise<JsonRpcResponse | null>
}

type HeaderSource = { get(name: string): string | null }

type Call = {
  id: JsonRpcId
  method: string
  params: Record<string, unknown>
  version: ProtocolVersion
  era: ProtocolEra
  origin: string
  signal: AbortSignal
  headers: HeaderSource | null
}

type Outcome = { status: number; body: JsonRpcResponse | null; retryAfter?: number }

type Resolution = { ok: true; version: ProtocolVersion; era: ProtocolEra } | { ok: false; outcome: Outcome }

const TOOL_LANG: Locale = 'en'

const ANNOTATIONS: McpToolAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }

const ALLOWED_HEADERS = ['content-type', 'accept', MCP_HEADERS.protocolVersion, MCP_HEADERS.method, MCP_HEADERS.name, 'mcp-session-id', 'last-event-id']

const BASE_HEADERS: Record<string, string> = {
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-expose-headers': 'retry-after',
}

const UNAVAILABLE_RETRY_SECONDS = 30

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function failure(id: JsonRpcId | null, code: JsonRpcErrorCode, message: string, status: number, data?: unknown): Outcome {
  const error: JsonRpcError = data === undefined ? { code, message } : { code, message, data }
  return { status, body: { jsonrpc: '2.0', id, error } }
}

function respond({ status, body, retryAfter }: Outcome, extra: Record<string, string> = {}): Response {
  const headers: Record<string, string> = { ...BASE_HEADERS, ...extra }
  if (retryAfter !== undefined) headers['retry-after'] = String(retryAfter)
  if (body === null) return new Response(null, { status, headers })
  headers['content-type'] = 'application/json'
  return new Response(JSON.stringify(body), { status, headers })
}

function validOrigin(value: string | null): boolean {
  if (value === null || value === 'null') return true
  try {
    return new URL(value).protocol.length > 1
  } catch {
    return false
  }
}

function requestOrigin(request: Request): string {
  if (process.env.VERCEL_ENV === 'production') return getSiteUrl().origin
  try {
    return new URL(request.url).origin
  } catch {
    return getSiteUrl().origin
  }
}

async function readBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

function limited(id: JsonRpcId, verdict: Exclude<LimitVerdict, { allowed: true }>): Outcome {
  const outcome = failure(
    id,
    JSONRPC_ERROR.rateLimited,
    `Rate limit exceeded (${verdict.scope}). Try again in ${verdict.retryAfterSeconds} seconds.`,
    429,
    { scope: verdict.scope, retryAfterSeconds: verdict.retryAfterSeconds },
  )
  return { ...outcome, retryAfter: verdict.retryAfterSeconds }
}

function unavailable(id: JsonRpcId): Outcome {
  const outcome = failure(id, JSONRPC_ERROR.unavailable, 'Service temporarily unavailable: the rate limit store did not respond.', 503)
  return { ...outcome, retryAfter: UNAVAILABLE_RETRY_SECONDS }
}

function headerMismatch(id: JsonRpcId, message: string): Resolution {
  return { ok: false, outcome: failure(id, JSONRPC_ERROR.headerMismatch, `Header mismatch: ${message}`, 400) }
}

function unsupportedVersion(id: JsonRpcId, requested: string): Resolution {
  return {
    ok: false,
    outcome: failure(id, JSONRPC_ERROR.unsupportedProtocolVersion, 'Unsupported protocol version', 400, {
      supported: [...SUPPORTED_PROTOCOL_VERSIONS],
      requested: requested.slice(0, 32),
    }),
  }
}

function resolveVersion(message: JsonRpcMessage & { id: JsonRpcId }, headers: HeaderSource): Resolution {
  const params = message.params ?? {}
  const meta = isRecord(params._meta) ? params._meta : undefined
  const metaVersion = meta?.[META_KEYS.protocolVersion]
  const headerVersion = headers.get(MCP_HEADERS.protocolVersion)?.trim() || null

  if (message.method === 'initialize' && metaVersion === undefined) {
    return { ok: true, version: negotiateLegacyVersion(params.protocolVersion), era: 'legacy' }
  }

  if (metaVersion !== undefined || isModernVersion(headerVersion)) {
    if (typeof metaVersion !== 'string') {
      return { ok: false, outcome: failure(message.id, JSONRPC_ERROR.invalidParams, `Missing required _meta field ${META_KEYS.protocolVersion}.`, 400) }
    }
    if (!isModernVersion(metaVersion)) return unsupportedVersion(message.id, metaVersion)
    if (!isRecord(meta?.[META_KEYS.clientCapabilities])) {
      return { ok: false, outcome: failure(message.id, JSONRPC_ERROR.invalidParams, `Missing required _meta field ${META_KEYS.clientCapabilities}.`, 400) }
    }
    if (headerVersion === null) return headerMismatch(message.id, 'the MCP-Protocol-Version header is missing.')
    if (headerVersion !== metaVersion) return headerMismatch(message.id, 'MCP-Protocol-Version does not match the protocol version in _meta.')
    const method = headers.get(MCP_HEADERS.method)
    if (method === null) return headerMismatch(message.id, 'the Mcp-Method header is missing.')
    if (method !== message.method) return headerMismatch(message.id, 'Mcp-Method does not match the method in the body.')
    if (NAMED_METHODS.has(message.method)) {
      const name = headers.get(MCP_HEADERS.name)
      if (name === null) return headerMismatch(message.id, 'the Mcp-Name header is missing.')
      if (decodeHeaderValue(name) !== params.name) return headerMismatch(message.id, 'Mcp-Name does not match params.name.')
    }
    return { ok: true, version: metaVersion, era: 'modern' }
  }

  if (headerVersion === null) return { ok: true, version: HEADERLESS_LEGACY_VERSION, era: 'legacy' }
  if (!isLegacyVersion(headerVersion)) return unsupportedVersion(message.id, headerVersion)
  return { ok: true, version: headerVersion, era: 'legacy' }
}

export function toolDescriptor(tool: McpTool<unknown, unknown>, version: ProtocolVersion = LATEST_PROTOCOL_VERSION): McpToolDescriptor {
  const descriptor: McpToolDescriptor = {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: inputJsonSchema(tool.inputSchema),
    annotations: ANNOTATIONS,
  }
  if (tool.outputSchema && supportsStructuredContent(version)) descriptor.outputSchema = outputJsonSchema(tool.outputSchema)
  return descriptor
}

export function promptDescriptor(prompt: McpPrompt): McpPromptDescriptor {
  return { name: prompt.name, title: prompt.title, description: prompt.description, arguments: prompt.arguments }
}

export function createMcpHandler(options: McpServerOptions): McpHandler {
  const tools = new Map(options.tools.map((tool) => [tool.name, tool]))
  const prompts = new Map((options.prompts ?? []).map((prompt) => [prompt.name, prompt]))
  const serverInfo = { name: options.name, ...(options.title ? { title: options.title } : {}), version: options.version }
  const capabilities = {
    tools: { listChanged: false },
    ...(prompts.size > 0 ? { prompts: { listChanged: false } } : {}),
  }
  const descriptors = new Map<ProtocolVersion, McpToolDescriptor[]>()
  const listTools = (version: ProtocolVersion) => {
    const cached = descriptors.get(version)
    if (cached) return cached
    const built = options.tools.map((tool) => toolDescriptor(tool, version))
    descriptors.set(version, built)
    return built
  }

  const decorate = (call: Call, result: Record<string, unknown>): Record<string, unknown> =>
    call.era === 'modern' || call.method === 'server/discover'
      ? { resultType: 'complete', ...result, _meta: { [META_KEYS.serverInfo]: serverInfo } }
      : result

  const cacheable = (call: Call): Record<string, unknown> => (call.era === 'modern' ? { ttlMs: LIST_TTL_MS, cacheScope: 'public' } : {})

  const ok = (call: Call, result: Record<string, unknown>): Outcome => ({
    status: 200,
    body: { jsonrpc: '2.0', id: call.id, result: decorate(call, result) },
  })

  const toolError = (call: Call, message: string): Outcome => ok(call, { content: [{ type: 'text', text: message }], isError: true })

  const internal = (call: Call, scope: string, error: unknown): Outcome => {
    logServerError(`mcp.${options.name}.${scope}`, error)
    return failure(call.id, JSONRPC_ERROR.internal, 'Internal error', 200)
  }

  const methodNotFound = (call: Call): Outcome =>
    failure(call.id, JSONRPC_ERROR.methodNotFound, `Method not found: ${call.method}`, call.era === 'modern' ? 404 : 200)

  const context = (call: Call): McpContext => ({
    lang: TOOL_LANG,
    origin: call.origin,
    requestId: call.id,
    protocolVersion: call.version,
    signal: call.signal,
  })

  const callTool = async (call: Call): Promise<Outcome> => {
    const params = toolCallParamsSchema.safeParse(call.params)
    if (!params.success) return failure(call.id, JSONRPC_ERROR.invalidParams, `Invalid tools/call params: ${describeIssues(params.error)}`, 200)
    const tool = tools.get(params.data.name)
    if (!tool) {
      return failure(call.id, JSONRPC_ERROR.invalidParams, `Unknown tool: ${params.data.name}`, 200, { tools: [...tools.keys()] })
    }
    if (tool.limit && call.headers) {
      try {
        const verdict = await checkToolLimit(call.headers, tool.limit)
        if (!verdict.allowed) return limited(call.id, verdict)
      } catch (error) {
        if (error instanceof McpLimitUnavailableError) return unavailable(call.id)
        throw error
      }
    }
    const input = tool.inputSchema.safeParse(params.data.arguments ?? {})
    if (!input.success) return toolError(call, `Invalid arguments for ${tool.name}: ${describeIssues(input.error)}`)
    let result: Awaited<ReturnType<typeof tool.handler>>
    try {
      result = await tool.handler(input.data, context(call))
    } catch (error) {
      if (error instanceof McpToolError) return toolError(call, error.message)
      return internal(call, tool.name, error)
    }
    if (result.sources.length === 0) return internal(call, tool.name, new Error('tool result without sources'))
    const body: Record<string, unknown> = { content: [{ type: 'text', text: result.text }], isError: false }
    if (tool.outputSchema) {
      const output = tool.outputSchema.safeParse(result.structured)
      if (!output.success) return internal(call, tool.name, new Error('tool result does not match its outputSchema'))
      if (supportsStructuredContent(call.version)) body.structuredContent = output.data
    }
    return ok(call, body)
  }

  const getPrompt = (call: Call): Outcome => {
    const params = promptGetParamsSchema.safeParse(call.params)
    if (!params.success) return failure(call.id, JSONRPC_ERROR.invalidParams, `Invalid prompts/get params: ${describeIssues(params.error)}`, 200)
    const prompt = prompts.get(params.data.name)
    if (!prompt) return failure(call.id, JSONRPC_ERROR.invalidParams, `Unknown prompt: ${params.data.name}`, 200, { prompts: [...prompts.keys()] })
    const args = params.data.arguments ?? {}
    const missing = prompt.arguments.filter((argument) => argument.required && !args[argument.name]?.trim()).map((argument) => argument.name)
    if (missing.length > 0) return failure(call.id, JSONRPC_ERROR.invalidParams, `Missing required arguments: ${missing.join(', ')}`, 200)
    try {
      const messages = prompt.render(args, context(call))
      return ok(call, {
        description: prompt.description,
        messages: messages.map((message) => ({ role: message.role, content: { type: 'text', text: message.text } })),
      })
    } catch (error) {
      return internal(call, prompt.name, error)
    }
  }

  const dispatch = async (call: Call): Promise<Outcome> => {
    switch (call.method) {
      case 'initialize':
        if (call.era === 'legacy') {
          return ok(call, { protocolVersion: call.version, capabilities, serverInfo, instructions: options.instructions })
        }
        break
      case 'ping':
        if (call.era === 'legacy') return ok(call, {})
        break
      case 'server/discover':
        return ok(call, {
          supportedVersions: [...SUPPORTED_PROTOCOL_VERSIONS],
          capabilities,
          instructions: options.instructions,
          ttlMs: DISCOVER_TTL_MS,
          cacheScope: 'public',
        })
      case 'tools/list':
        return ok(call, { tools: listTools(call.version), ...cacheable(call) })
      case 'tools/call':
        return callTool(call)
      case 'prompts/list':
        if (prompts.size > 0) return ok(call, { prompts: [...prompts.values()].map(promptDescriptor), ...cacheable(call) })
        break
      case 'prompts/get':
        if (prompts.size > 0) return getPrompt(call)
        break
    }
    return methodNotFound(call)
  }

  const handle = async (request: Request): Promise<Outcome> => {
    if (!validOrigin(request.headers.get('origin'))) return failure(null, JSONRPC_ERROR.forbiddenOrigin, 'Forbidden origin', 403)

    const raw = await readBody(request)
    if (raw === null) return failure(null, JSONRPC_ERROR.payloadTooLarge, `Request body exceeds ${MAX_BODY_BYTES} bytes.`, 413)

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return failure(null, JSONRPC_ERROR.parse, 'Parse error: the body is not valid JSON.', 400)
    }
    if (Array.isArray(parsed)) {
      return failure(null, JSONRPC_ERROR.invalidRequest, 'Invalid Request: JSON-RPC batches are not supported. Send one message per POST.', 400)
    }
    const envelope = jsonRpcMessageSchema.safeParse(parsed)
    if (!envelope.success) {
      const id = isRecord(parsed) && (typeof parsed.id === 'string' || typeof parsed.id === 'number') ? parsed.id : null
      return failure(id, JSONRPC_ERROR.invalidRequest, 'Invalid Request: expected a JSON-RPC 2.0 request or notification.', 400)
    }
    const message = envelope.data
    if (message.id === undefined) return { status: 202, body: null }
    const identified = { ...message, id: message.id }

    const resolved = resolveVersion(identified, request.headers)
    if (!resolved.ok) return resolved.outcome

    try {
      const verdict = await checkServerLimits(request.headers, options.limits)
      if (!verdict.allowed) return limited(identified.id, verdict)
    } catch (error) {
      if (error instanceof McpLimitUnavailableError) return unavailable(identified.id)
      throw error
    }

    return dispatch({
      id: identified.id,
      method: identified.method,
      params: identified.params ?? {},
      version: resolved.version,
      era: resolved.era,
      origin: requestOrigin(request),
      signal: request.signal,
      headers: request.headers,
    })
  }

  const notAllowed = (): Response =>
    respond(
      failure(null, JSONRPC_ERROR.invalidRequest, 'Method Not Allowed: this server keeps no sessions and opens no SSE streams. Send JSON-RPC messages with POST.', 405),
      { allow: 'POST, OPTIONS' },
    )

  return {
    async POST(request) {
      try {
        return respond(await handle(request))
      } catch (error) {
        logServerError(`mcp.${options.name}.transport`, error)
        return respond(failure(null, JSONRPC_ERROR.internal, 'Internal error', 500))
      }
    },
    GET: notAllowed,
    DELETE: notAllowed,
    OPTIONS() {
      return new Response(null, {
        status: 204,
        headers: {
          ...BASE_HEADERS,
          'access-control-allow-methods': 'POST, GET, DELETE, OPTIONS',
          'access-control-allow-headers': ALLOWED_HEADERS.join(', '),
          'access-control-max-age': '86400',
        },
      })
    },
    async rpc(message, rpcOptions = {}) {
      const envelope = jsonRpcMessageSchema.safeParse(message)
      if (!envelope.success || envelope.data.id === undefined) return null
      const version = rpcOptions.version ?? LATEST_PROTOCOL_VERSION
      const outcome = await dispatch({
        id: envelope.data.id,
        method: envelope.data.method,
        params: envelope.data.params ?? {},
        version,
        era: isModernVersion(version) ? 'modern' : 'legacy',
        origin: rpcOptions.origin ?? getSiteUrl().origin,
        signal: new AbortController().signal,
        headers: null,
      })
      return outcome.body
    },
  }
}