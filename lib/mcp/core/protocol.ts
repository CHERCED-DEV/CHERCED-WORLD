import { z } from 'zod'

export const PROTOCOL_CHECKED_ON = '2026-11-26'

export const PROTOCOL_SOURCE = 'https://modelcontextprotocol.io/specification/2026-07-28/changelog'

export const MODERN_PROTOCOL_VERSIONS = ['2026-07-28'] as const

export const LEGACY_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'] as const

export const SUPPORTED_PROTOCOL_VERSIONS = [...MODERN_PROTOCOL_VERSIONS, ...LEGACY_PROTOCOL_VERSIONS] as const

export type ModernProtocolVersion = (typeof MODERN_PROTOCOL_VERSIONS)[number]

export type LegacyProtocolVersion = (typeof LEGACY_PROTOCOL_VERSIONS)[number]

export type ProtocolVersion = (typeof SUPPORTED_PROTOCOL_VERSIONS)[number]

export type ProtocolEra = 'modern' | 'legacy'

export const LATEST_PROTOCOL_VERSION: ModernProtocolVersion = '2026-07-28'

export const LATEST_LEGACY_PROTOCOL_VERSION: LegacyProtocolVersion = '2025-11-25'

export const HEADERLESS_LEGACY_VERSION: LegacyProtocolVersion = '2025-03-26'

const STRUCTURED_SINCE = '2025-06-18'

export function isModernVersion(value: unknown): value is ModernProtocolVersion {
  return typeof value === 'string' && (MODERN_PROTOCOL_VERSIONS as readonly string[]).includes(value)
}

export function isLegacyVersion(value: unknown): value is LegacyProtocolVersion {
  return typeof value === 'string' && (LEGACY_PROTOCOL_VERSIONS as readonly string[]).includes(value)
}

export function eraOf(version: ProtocolVersion): ProtocolEra {
  return isModernVersion(version) ? 'modern' : 'legacy'
}

export function supportsStructuredContent(version: ProtocolVersion): boolean {
  return version >= STRUCTURED_SINCE
}

export function negotiateLegacyVersion(requested: unknown): LegacyProtocolVersion {
  return isLegacyVersion(requested) ? requested : LATEST_LEGACY_PROTOCOL_VERSION
}

export const META_KEYS = {
  protocolVersion: 'io.modelcontextprotocol/protocolVersion',
  clientInfo: 'io.modelcontextprotocol/clientInfo',
  clientCapabilities: 'io.modelcontextprotocol/clientCapabilities',
  serverInfo: 'io.modelcontextprotocol/serverInfo',
} as const

export const MCP_HEADERS = {
  protocolVersion: 'mcp-protocol-version',
  method: 'mcp-method',
  name: 'mcp-name',
} as const

export const NAMED_METHODS: ReadonlySet<string> = new Set(['tools/call', 'prompts/get'])

export const JSONRPC_ERROR = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  headerMismatch: -32020,
  unsupportedProtocolVersion: -32022,
  forbiddenOrigin: -31403,
  payloadTooLarge: -31413,
  rateLimited: -31429,
  unavailable: -31503,
} as const

export type JsonRpcErrorCode = (typeof JSONRPC_ERROR)[keyof typeof JSONRPC_ERROR]

export const MAX_BODY_BYTES = 64 * 1024

export const LIST_TTL_MS = 5 * 60_000

export const DISCOVER_TTL_MS = 60 * 60_000

export type JsonRpcId = string | number

export type JsonRpcError = { code: JsonRpcErrorCode; message: string; data?: unknown }

export type JsonRpcErrorResponse = { jsonrpc: '2.0'; id: JsonRpcId | null; error: JsonRpcError }

export type JsonRpcResultResponse = { jsonrpc: '2.0'; id: JsonRpcId; result: Record<string, unknown> }

export type JsonRpcResponse = JsonRpcErrorResponse | JsonRpcResultResponse

export const jsonRpcIdSchema = z.union([z.string().max(256), z.number().finite()])

export const jsonRpcMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: jsonRpcIdSchema.optional(),
  method: z.string().min(1).max(128),
  params: z.record(z.string(), z.unknown()).optional(),
})

export type JsonRpcMessage = z.infer<typeof jsonRpcMessageSchema>

export const toolCallParamsSchema = z.object({
  name: z.string().min(1).max(128),
  arguments: z.record(z.string(), z.unknown()).optional(),
})

export const promptGetParamsSchema = z.object({
  name: z.string().min(1).max(128),
  arguments: z.record(z.string(), z.string().max(8000)).optional(),
})

const BASE64_SENTINEL = /^=\?base64\?([A-Za-z0-9+/=]*)\?=$/

export function decodeHeaderValue(value: string): string {
  const encoded = BASE64_SENTINEL.exec(value)
  if (!encoded) return value
  return Buffer.from(encoded[1] ?? '', 'base64').toString('utf8')
}
