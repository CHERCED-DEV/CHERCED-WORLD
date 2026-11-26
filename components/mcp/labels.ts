import { t, type Dictionary } from '@/lib/i18n/translate'

export const MCP_TRY_EVENT = 'cw-mcp-try'

export type McpConnectLabels = { title: string; url: string; copy: string; copied: string; copyError: string; clients: string; ask: string }

export type McpCatalogLabels = {
  title: string
  lead: string
  tools: string
  prompts: string
  readOnly: string
  params: string
  noParams: string
  required: string
  optional: string
  try: string
  tryLabel: string
}

export type McpTesterLabels = {
  title: string
  lead: string
  version: string
  modern: string
  legacy: string
  steps: string
  tool: string
  args: string
  call: string
  clear: string
  log: string
  request: string
  response: string
  meta: string
  copy: string
  copied: string
  copyError: string
  empty: string
  failed: string
  badJson: string
  sending: string
  done: string
  noscript: string
  fictional: string
}

export type McpPageLabels = {
  back: string
  title: string
  lead: string
  what: string
  versions: string
  limits: string
  limitsTitle: string
  limitsBody: string
  code: string
  tested: string
  pending: string
  connect: McpConnectLabels
  catalog: McpCatalogLabels
  tester: McpTesterLabels
}

function group<K extends string>(dict: Dictionary, prefix: string, keys: readonly K[]): Record<K, string> {
  return Object.fromEntries(keys.map((key) => [key, t(dict, `${prefix}.${key}`)])) as Record<K, string>
}

export function mcpPageLabels(dict: Dictionary, vars: { versions: string; visitor: string; match: string; daily: string }): McpPageLabels {
  return {
    back: t(dict, 'mcp.back'),
    title: t(dict, 'mcp.title'),
    lead: t(dict, 'mcp.lead'),
    what: t(dict, 'mcp.what'),
    versions: t(dict, 'mcp.facts.versions', { versions: vars.versions }),
    limits: t(dict, 'mcp.facts.limits', { visitor: vars.visitor, match: vars.match, daily: vars.daily }),
    limitsTitle: t(dict, 'mcp.limits.title'),
    limitsBody: t(dict, 'mcp.limits.body'),
    code: t(dict, 'mcp.code'),
    tested: t(dict, 'mcp.connect.tested'),
    pending: t(dict, 'mcp.connect.pending'),
    connect: group(dict, 'mcp.connect', ['title', 'url', 'copy', 'copied', 'copyError', 'clients', 'ask']),
    catalog: group(dict, 'mcp.catalog', ['title', 'lead', 'tools', 'prompts', 'readOnly', 'params', 'noParams', 'required', 'optional', 'try', 'tryLabel']),
    tester: group(dict, 'mcp.tester', [
      'title',
      'lead',
      'version',
      'modern',
      'legacy',
      'steps',
      'tool',
      'args',
      'call',
      'clear',
      'log',
      'request',
      'response',
      'meta',
      'copy',
      'copied',
      'copyError',
      'empty',
      'failed',
      'badJson',
      'sending',
      'done',
      'noscript',
      'fictional',
    ]),
  }
}

export function fillLabel(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : match))
}