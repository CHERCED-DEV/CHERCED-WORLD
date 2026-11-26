import type { McpHandler } from '@/lib/mcp/core/handler'

export const MODERN = '2026-07-28'

export const ORIGIN = 'http://localhost:3142'

export const ENDPOINT = `${ORIGIN}/api/mcp`

let counter = 0

export function freshIp(): string {
  counter += 1
  return `198.51.100.${counter % 250}`
}

export function modernMeta(version: string = MODERN): Record<string, unknown> {
  return {
    'io.modelcontextprotocol/protocolVersion': version,
    'io.modelcontextprotocol/clientInfo': { name: 'vitest', version: '1.0.0' },
    'io.modelcontextprotocol/clientCapabilities': {},
  }
}

type SendInit = { ip?: string; headers?: Record<string, string>; id?: string | number }

export function modernRequest(method: string, params: Record<string, unknown> = {}, init: SendInit = {}): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'mcp-protocol-version': MODERN,
    'mcp-method': method,
    'x-forwarded-for': init.ip ?? freshIp(),
  }
  if (typeof params.name === 'string' && (method === 'tools/call' || method === 'prompts/get')) headers['mcp-name'] = params.name
  const body = { jsonrpc: '2.0', id: init.id ?? 1, method, params: { ...params, _meta: modernMeta() } }
  return new Request(ENDPOINT, { method: 'POST', headers: { ...headers, ...init.headers }, body: JSON.stringify(body) })
}

export function legacyRequest(method: string, params: Record<string, unknown> | undefined, init: SendInit & { version?: string | null } = {}): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'x-forwarded-for': init.ip ?? freshIp(),
  }
  const version = init.version === undefined ? '2025-11-25' : init.version
  if (version !== null) headers['mcp-protocol-version'] = version
  const body = { jsonrpc: '2.0', id: init.id ?? 1, method, ...(params ? { params } : {}) }
  return new Request(ENDPOINT, { method: 'POST', headers: { ...headers, ...init.headers }, body: JSON.stringify(body) })
}

export function rawRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': freshIp(), ...headers },
    body,
  })
}

export type Reply = { status: number; headers: Headers; text: string; json: Record<string, unknown> | null }

export async function send(handler: Pick<McpHandler, 'POST'>, request: Request): Promise<Reply> {
  const response = await handler.POST(request)
  const text = await response.text()
  let json: Record<string, unknown> | null = null
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    json = null
  }
  return { status: response.status, headers: response.headers, text, json }
}

export function resultOf(reply: Reply): Record<string, unknown> {
  const result = reply.json?.result
  if (!result || typeof result !== 'object') throw new Error(`Sin result: ${reply.text}`)
  return result as Record<string, unknown>
}

export function errorOf(reply: Reply): { code: number; message: string; data?: unknown } {
  const error = reply.json?.error
  if (!error || typeof error !== 'object') throw new Error(`Sin error: ${reply.text}`)
  return error as { code: number; message: string; data?: unknown }
}

export type ToolCallResult = {
  content: Array<{ type: string; text: string }>
  structuredContent?: unknown
  isError: boolean
}

export async function callTool(handler: Pick<McpHandler, 'POST'>, name: string, args: Record<string, unknown> = {}): Promise<ToolCallResult> {
  const reply = await send(handler, modernRequest('tools/call', { name, arguments: args }))
  if (reply.status !== 200) throw new Error(`tools/call ${name} respondió ${reply.status}: ${reply.text}`)
  return resultOf(reply) as unknown as ToolCallResult
}

export function textOf(result: ToolCallResult): string {
  return result.content.map((item) => item.text).join('\n')
}