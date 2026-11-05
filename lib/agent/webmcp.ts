import type { Capability, CapabilityDescriptions, PreferencesPort } from '@/lib/capabilities'
import type { Locale } from '@/lib/i18n/config'
import type { SearchIndex } from '@/lib/search/types'

export type ToolResult = { content: Array<{ type: 'text'; text: string }>; isError?: true }

export type ModelContextTool = {
  name: string
  description: string
  inputSchema: Capability['inputSchema']
  annotations: { readOnlyHint: boolean }
  execute: (input: unknown) => Promise<ToolResult>
}

type ModelContext = {
  registerTool?: (tool: ModelContextTool, options?: { signal?: AbortSignal }) => unknown
  provideContext?: (context: { tools: ModelContextTool[] }) => unknown
  unregisterTool?: (name: string) => unknown
}

export type WebMcpScope = { document?: object; navigator?: object }

export type WebMcpOptions = {
  lang: Locale
  areas: readonly string[]
  origin: string | null
  preferences: PreferencesPort | null
  loadIndex?: (lang: Locale) => Promise<SearchIndex>
  loadDescriptions?: () => Promise<CapabilityDescriptions>
}

const ENTRY = 'modelContext'

function isModelContext(value: unknown): value is ModelContext {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) return false
  const candidate = value as ModelContext
  return typeof candidate.registerTool === 'function' || typeof candidate.provideContext === 'function'
}

function defaultScope(): WebMcpScope {
  return {
    document: typeof document === 'undefined' ? undefined : document,
    navigator: typeof navigator === 'undefined' ? undefined : navigator,
  }
}

export function findModelContext(scope: WebMcpScope = defaultScope()): ModelContext | null {
  for (const host of [scope.document, scope.navigator]) {
    if (!host) continue
    try {
      const api = (host as Record<string, unknown>)[ENTRY]
      if (isModelContext(api)) return api
    } catch {}
  }
  return null
}

export function hasWebMcp(scope?: WebMcpScope): boolean {
  return findModelContext(scope) !== null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function toModelContextTool(capability: Capability, lang: Locale): ModelContextTool {
  return {
    name: capability.name,
    description: capability.description[lang],
    inputSchema: capability.inputSchema,
    annotations: { readOnlyHint: capability.effect === 'read' },
    async execute(input) {
      try {
        const output = await capability.execute(input, { lang })
        return { content: [{ type: 'text', text: text(output) }] }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'error'
        return { content: [{ type: 'text', text: message }], isError: true }
      }
    },
  }
}

async function defaultDescriptions(): Promise<CapabilityDescriptions> {
  const [{ capabilityDescriptions }, es, en] = await Promise.all([
    import('@/lib/capabilities/registry'),
    import('@/content/i18n/es/experience.json'),
    import('@/content/i18n/en/experience.json'),
  ])
  return capabilityDescriptions(es.default, en.default)
}

async function defaultIndex(lang: Locale): Promise<SearchIndex> {
  const { loadSearchIndex } = await import('@/lib/search/client')
  return loadSearchIndex(lang)
}

const noop = () => {}

export async function connectWebMcp(options: WebMcpOptions, scope?: WebMcpScope): Promise<() => void> {
  const api = findModelContext(scope)
  if (!api) return noop
  const controller = new AbortController()
  const registered: string[] = []
  let provided = false
  const disconnect = () => {
    if (controller.signal.aborted) return
    controller.abort()
    try {
      if (provided) api.provideContext?.({ tools: [] })
      for (const name of registered) api.unregisterTool?.(name)
    } catch {}
  }
  try {
    const [{ createCapabilities }, descriptions] = await Promise.all([
      import('@/lib/capabilities/registry'),
      (options.loadDescriptions ?? defaultDescriptions)(),
    ])
    const tools = createCapabilities({
      loadIndex: options.loadIndex ?? defaultIndex,
      descriptions,
      areas: options.areas,
      origin: options.origin,
      preferences: options.preferences,
    }).map((capability) => toModelContextTool(capability, options.lang))

    if (typeof api.registerTool === 'function') {
      for (const tool of tools) {
        try {
          api.registerTool(tool, { signal: controller.signal })
          registered.push(tool.name)
        } catch {}
      }
    } else if (typeof api.provideContext === 'function') {
      api.provideContext({ tools })
      provided = true
    }
  } catch {}
  return disconnect
}
