import { describe, expect, it, vi } from 'vitest'
import type { Trace } from '@/lib/ai/agent/trace'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { default: traces } = await import('@/content/ailab/route/recorded-trace.json')
const { buildSearchIndex } = await import('@/lib/search/build-index')
const { SEARCH_TOOL, sitePaths } = await import('@/lib/ai/agent/tools')
const { summarize } = await import('@/lib/ai/agent/trace')

describe('traza grabada de respaldo (FR-4212, P-4206)', () => {
  it.each(['es', 'en'] as const)('%s: sale del simulador, sin Gemini, sin tokens y sin costo', (lang) => {
    const trace = traces[lang] as Trace
    expect(trace.mode).toBe('local')
    expect(trace.model).toBe('simulator')
    const summary = summarize(trace)
    expect(summary.turns).toBe(3)
    expect(summary.costUsd).toBe(0)
    expect(summary.tokens).toBe(0)
    for (const turn of trace.turns) {
      expect(turn.state).toBe('done')
      expect(turn.usage).toBeNull()
      expect(turn.firstAudioAt).toBeNull()
    }
  })

  it.each(['es', 'en'] as const)('%s: cada resultado de búsqueda apunta a una página que existe en el índice del sitio', async (lang) => {
    const trace = traces[lang] as Trace
    const paths = sitePaths(await buildSearchIndex(lang))
    const tools = trace.turns.flatMap((turn) => turn.tools)
    expect(tools.length).toBeGreaterThan(0)
    for (const tool of tools) {
      expect(tool.name).toBe(SEARCH_TOOL)
      if (tool.result.kind !== 'search') throw new Error('se esperaba una búsqueda')
      for (const hit of tool.result.hits) expect(paths.has(hit.url.split('#')[0]!), hit.url).toBe(true)
    }
  })
})
