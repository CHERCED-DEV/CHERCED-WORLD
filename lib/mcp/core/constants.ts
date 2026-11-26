export const PROTOCOL_CHECKED_ON = '2026-11-26'

export const PROTOCOL_SOURCE = 'https://modelcontextprotocol.io/specification/2026-07-28/changelog'

export const MODERN_PROTOCOL_VERSIONS = ['2026-07-28'] as const

export const LEGACY_PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'] as const

export const SUPPORTED_PROTOCOL_VERSIONS = [...MODERN_PROTOCOL_VERSIONS, ...LEGACY_PROTOCOL_VERSIONS] as const

export type ModernProtocolVersion = (typeof MODERN_PROTOCOL_VERSIONS)[number]

export type LegacyProtocolVersion = (typeof LEGACY_PROTOCOL_VERSIONS)[number]

export type ProtocolVersion = (typeof SUPPORTED_PROTOCOL_VERSIONS)[number]

export const LATEST_PROTOCOL_VERSION: ModernProtocolVersion = '2026-07-28'

export const LATEST_LEGACY_PROTOCOL_VERSION: LegacyProtocolVersion = '2025-11-25'

export const HEADERLESS_LEGACY_VERSION: LegacyProtocolVersion = '2025-03-26'

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