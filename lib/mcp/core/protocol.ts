import { z } from 'zod'
import {
  LATEST_LEGACY_PROTOCOL_VERSION,
  LEGACY_PROTOCOL_VERSIONS,
  MODERN_PROTOCOL_VERSIONS,
  type LegacyProtocolVersion,
  type ModernProtocolVersion,
  type ProtocolVersion,
} from './constants'

export * from './constants'

export type ProtocolEra = 'modern' | 'legacy'

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
