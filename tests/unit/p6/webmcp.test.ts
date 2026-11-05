import { describe, expect, it, vi } from 'vitest'
import type { ModelContextTool } from '@/lib/agent/webmcp'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const { buildSearchIndex } = await import('@/lib/search/build-index')
const { getDictionary } = await import('@/lib/i18n/server')
const { getSite } = await import('@/lib/content')
const { capabilityDescriptions } = await import('@/lib/capabilities')
const webmcp = await import('@/lib/agent/webmcp')

type Registered = ModelContextTool

const AREAS = (getSite().about.skills.lobes ?? []).map((lobe) => lobe.id)
const descriptions = capabilityDescriptions(await getDictionary('es', 'experience'), await getDictionary('en', 'experience'))
const indexes = { es: await buildSearchIndex('es'), en: await buildSearchIndex('en') }

function fakeApi() {
  const tools: Registered[] = []
  const signals: AbortSignal[] = []
  const api = {
    registerTool: vi.fn((tool: Registered, options?: { signal?: AbortSignal }) => {
      tools.push(tool)
      if (options?.signal) signals.push(options.signal)
    }),
    unregisterTool: vi.fn(),
  }
  return { api, tools, signals }
}

function options(lang: 'es' | 'en' = 'es') {
  return {
    lang,
    areas: AREAS,
    origin: 'https://cherced-world.test',
    preferences: null,
    loadIndex: vi.fn(async (target: 'es' | 'en') => indexes[target]),
    loadDescriptions: vi.fn(async () => descriptions),
  }
}

function parse(result: { content: Array<{ text: string }> }): unknown {
  return JSON.parse(result.content[0]?.text ?? 'null')
}

describe('detección de la API (R-401)', () => {
  it('busca primero document.modelContext y luego navigator.modelContext', () => {
    const onDocument = { registerTool: () => {} }
    const onNavigator = { registerTool: () => {} }
    expect(webmcp.findModelContext({ document: { modelContext: onDocument }, navigator: { modelContext: onNavigator } })).toBe(onDocument)
    expect(webmcp.findModelContext({ document: {}, navigator: { modelContext: onNavigator } })).toBe(onNavigator)
    expect(webmcp.findModelContext({ navigator: { modelContext: { provideContext: () => {} } } })).not.toBeNull()
  })

  it('sin la API, o con otra forma, no detecta nada', () => {
    expect(webmcp.findModelContext({})).toBeNull()
    expect(webmcp.findModelContext({ document: {}, navigator: {} })).toBeNull()
    expect(webmcp.findModelContext({ document: { modelContext: {} } })).toBeNull()
    expect(webmcp.findModelContext({ navigator: { modelContext: { registerTool: 'no' } } })).toBeNull()
    const throwing = Object.defineProperty({}, 'modelContext', {
      get() {
        throw new Error('blocked')
      },
    })
    expect(webmcp.findModelContext({ document: throwing })).toBeNull()
    expect(webmcp.hasWebMcp({})).toBe(false)
  })

  it('en Node, sin navegador, no hay API', () => {
    expect(webmcp.findModelContext()).toBeNull()
  })
})

describe('registro y baja', () => {
  it('sin la API no hace nada: no carga el registro, ni el índice, ni las descripciones', async () => {
    const opts = options()
    const errors = vi.spyOn(console, 'error')
    const disconnect = await webmcp.connectWebMcp(opts, { document: {}, navigator: {} })
    disconnect()
    expect(opts.loadDescriptions).not.toHaveBeenCalled()
    expect(opts.loadIndex).not.toHaveBeenCalled()
    expect(errors).not.toHaveBeenCalled()
  })

  it.each(['es', 'en'] as const)('registra las ocho herramientas con descripción en el idioma activo (%s)', async (lang) => {
    const { api, tools, signals } = fakeApi()
    await webmcp.connectWebMcp(options(lang), { document: { modelContext: api } })
    expect(tools.map((tool) => tool.name)).toEqual([
      'search_portfolio',
      'get_project',
      'list_projects',
      'get_experience',
      'get_skills',
      'list_posts',
      'get_cv',
      'set_preferences',
    ])
    for (const tool of tools) {
      expect(tool.description).toBe(descriptions[tool.name as keyof typeof descriptions][lang])
      expect((tool.inputSchema as { type: string }).type).toBe('object')
      expect(tool.annotations.readOnlyHint).toBe(tool.name !== 'set_preferences')
    }
    expect(signals).toHaveLength(8)
    expect(signals.every((signal) => !signal.aborted)).toBe(true)
  })

  it('se da de baja abortando la señal y, si existe, con unregisterTool', async () => {
    const { api, signals } = fakeApi()
    const disconnect = await webmcp.connectWebMcp(options(), { navigator: { modelContext: api } })
    disconnect()
    disconnect()
    expect(signals.every((signal) => signal.aborted)).toBe(true)
    expect(api.unregisterTool).toHaveBeenCalledTimes(8)
  })

  it('con una API que solo trae provideContext, entrega todas juntas y las retira al bajar', async () => {
    const provideContext = vi.fn()
    const disconnect = await webmcp.connectWebMcp(options(), { document: { modelContext: { provideContext } } })
    expect(provideContext).toHaveBeenCalledTimes(1)
    expect((provideContext.mock.calls[0]?.[0] as { tools: unknown[] }).tools).toHaveLength(8)
    disconnect()
    expect(provideContext).toHaveBeenLastCalledWith({ tools: [] })
  })

  it('si el navegador rechaza una herramienta, registra las demás y no escribe errores', async () => {
    const errors = vi.spyOn(console, 'error')
    const names: string[] = []
    const api = {
      registerTool(tool: Registered) {
        if (tool.name === 'get_cv') throw new Error('duplicate')
        names.push(tool.name)
      },
    }
    await webmcp.connectWebMcp(options(), { document: { modelContext: api } })
    expect(names).toHaveLength(7)
    expect(names).not.toContain('get_cv')
    expect(errors).not.toHaveBeenCalled()
  })

  it('si falla la carga diferida, no rompe ni escribe errores', async () => {
    const errors = vi.spyOn(console, 'error')
    const { api, tools } = fakeApi()
    const opts = { ...options(), loadDescriptions: vi.fn(async () => Promise.reject(new Error('offline'))) }
    const disconnect = await webmcp.connectWebMcp(opts, { document: { modelContext: api } })
    expect(tools).toEqual([])
    expect(() => disconnect()).not.toThrow()
    expect(errors).not.toHaveBeenCalled()
  })
})

describe('ejecución con el formato de resultado de MCP', () => {
  it('devuelve el JSON de la capacidad como texto, y lee el índice del idioma activo', async () => {
    const { api, tools } = fakeApi()
    const opts = options('en')
    await webmcp.connectWebMcp(opts, { document: { modelContext: api } })
    const search = tools.find((tool) => tool.name === 'search_portfolio')
    const result = await search!.execute({ query: 'Synergos', limit: 3 })
    expect(result.isError).toBeUndefined()
    const output = parse(result) as { results: Array<{ title: string; url: string }> }
    expect(output.results.length).toBeGreaterThan(0)
    expect(output.results.length).toBeLessThanOrEqual(3)
    expect(output.results[0]?.url.startsWith('https://cherced-world.test/en/')).toBe(true)
    expect(opts.loadIndex).toHaveBeenCalledWith('en')
  })

  it('una entrada inválida vuelve como isError, sin lanzar', async () => {
    const { api, tools } = fakeApi()
    await webmcp.connectWebMcp(options(), { document: { modelContext: api } })
    const byName = (name: string) => tools.find((tool) => tool.name === name)!
    const tooLong = await byName('search_portfolio').execute({ query: 'x'.repeat(101) })
    expect(tooLong.isError).toBe(true)
    expect(tooLong.content[0]?.text).toMatch(/query/)
    expect((await byName('get_project').execute({ id: 'nope' })).isError).toBe(true)
    expect((await byName('get_project').execute('not an object')).isError).toBe(true)
    expect((await byName('set_preferences').execute({ theme: 'dark' })).isError).toBe(true)
  })

  it('set_preferences usa el puerto de preferencias del navegador', async () => {
    const { api, tools } = fakeApi()
    const preferences = { language: () => 'es' as const, setLanguage: vi.fn(), theme: () => 'dark' as const, setTheme: vi.fn() }
    await webmcp.connectWebMcp({ ...options(), preferences }, { document: { modelContext: api } })
    const result = await tools.find((tool) => tool.name === 'set_preferences')!.execute({ theme: 'light' })
    expect(result.isError).toBeUndefined()
    expect(preferences.setTheme).toHaveBeenCalledWith('light')
    expect(preferences.setLanguage).not.toHaveBeenCalled()
  })
})
