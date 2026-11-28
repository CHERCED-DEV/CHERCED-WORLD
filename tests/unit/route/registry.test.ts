import { describe, expect, it } from 'vitest'
import { coreRoute, routeGuides, routeStations, routeStationSchema, type RouteStation } from '@/content/ailab/route'
import { coreMinutes, ROUTE_BUDGET_MINUTES, routeRegistryProblems, routeSections } from '@/lib/ailab/route/registry'
import { registryEnv } from './support'

const env = registryEnv()

const mcpStation: RouteStation = {
  id: 'mcp-en-vivo',
  proof: 1,
  alsoProves: [3],
  title: { es: 'MCP en vivo', en: 'Live MCP' },
  minutes: 3,
  steps: [
    { es: 'Conecta tu cliente al MCP del portafolio.', en: 'Connect your client to the portfolio MCP.' },
    { es: 'Llama a una herramienta y mira su respuesta.', en: 'Call a tool and look at its answer.' },
  ],
  href: '/ai-lab#lab-v5',
  evidence: ['mcp-call'],
  spec: '044',
}

function problemsWith(stations: readonly RouteStation[]) {
  return routeRegistryProblems(stations, coreRoute, env)
}

describe('registro de estaciones de la ruta (FR-4208, FR-4209)', () => {
  it('el registro de la línea cumple el contrato completo, guías incluidas', () => {
    expect(routeRegistryProblems(routeStations, coreRoute, env, routeGuides)).toEqual([])
  })

  it('cada estación pasa el esquema Zod y los ids no se repiten', () => {
    for (const station of routeStations) expect(routeStationSchema.safeParse(station).success, station.id).toBe(true)
    expect(new Set(routeStations.map((station) => station.id)).size).toBe(routeStations.length)
  })

  it('FR-4202: la ruta núcleo son cuatro estaciones, una por prueba, y suman 10 minutos o menos', () => {
    const sections = routeSections(routeStations, coreRoute)
    expect(sections.map((section) => [section.proof, section.core.id])).toEqual([
      [1, 'agente-en-vivo'],
      [2, 'encaje-y-pitch'],
      [3, 'codigo-real'],
      [4, 'tablero-en-numeros'],
    ])
    expect(coreMinutes(routeStations, coreRoute)).toBeLessThanOrEqual(ROUTE_BUDGET_MINUTES)
    expect(sections[0]!.more.map((station) => station.id)).toEqual(['rompelo', 'diseno-de-sistemas', 'mcp-en-tu-agente', 'arena'])
  })

  it('cada estación tiene de dos a cuatro pasos, con título y pasos en español y en inglés', () => {
    for (const station of routeStations) {
      expect(station.steps.length, station.id).toBeGreaterThanOrEqual(2)
      expect(station.steps.length, station.id).toBeLessThanOrEqual(4)
      for (const text of [station.title, ...station.steps]) {
        expect(text.es.trim(), station.id).not.toBe('')
        expect(text.en.trim(), station.id).not.toBe('')
        expect(text.es, station.id).not.toBe(text.en)
      }
    }
  })

  it('los href internos existen en las rutas de app/ y en las anclas del catálogo', () => {
    expect(env.pages.has('/ai-lab')).toBe(true)
    expect(env.pages.has('/ai-lab/codigo')).toBe(true)
    expect(env.anchors.has('/ai-lab#lab-v5')).toBe(true)
    expect(env.anchors.has('/portfolio/12#case-pitch-12')).toBe(true)
  })

  it('SC-4203: falla con un href interno que no existe y dice por qué', () => {
    const broken = { ...routeStations[1]!, href: '/ai-lab/no-existe' }
    expect(problemsWith([routeStations[0]!, broken, ...routeStations.slice(2)])).toEqual(['encaje-y-pitch: href /ai-lab/no-existe: la página /ai-lab/no-existe no existe'])
    const anchor = { ...routeStations[1]!, href: '/ai-lab#lab-z9' }
    expect(problemsWith([routeStations[0]!, anchor, ...routeStations.slice(2)])).toEqual(['encaje-y-pitch: href /ai-lab#lab-z9: el ancla #lab-z9 no existe en /ai-lab'])
  })

  it('SC-4203: falla con una ruta núcleo de más de 10 minutos', () => {
    const long = { ...routeStations[0]!, minutes: 4 }
    expect(problemsWith([long, ...routeStations.slice(1)])).toEqual(['ruta núcleo: suma 11 minutos y el tope es 10'])
  })

  it('falla si una prueba se queda sin estación, si la núcleo no está o si es de otra prueba', () => {
    const withoutFour = routeStations.filter((station) => station.proof !== 4)
    expect(problemsWith(withoutFour)).toEqual(['prueba 4: no tiene ninguna estación', 'prueba 4: la estación núcleo tablero-en-numeros no está en el registro'])
    const moved = routeStations.map((station) => (station.id === 'codigo-real' ? { ...station, proof: 4 as const } : station))
    expect(problemsWith(moved)).toEqual(['prueba 3: no tiene ninguna estación', 'prueba 3: la estación núcleo codigo-real es de la prueba 4'])
  })

  it('el esquema rechaza pasos fuera de 2 a 4, inglés vacío, alsoProves que repite proof, href con idioma y URLs ajenas', () => {
    const base = routeStations[0]!
    const cases: Array<[Partial<RouteStation>, string]> = [
      [{ steps: [base.steps[0]!] }, 'steps'],
      [{ steps: [...base.steps, base.steps[0]!] }, 'steps'],
      [{ title: { es: 'Agente', en: ' ' } }, 'title.en'],
      [{ alsoProves: [1] }, 'alsoProves'],
      [{ href: '/es/ai-lab#lab-v5' }, 'href'],
      [{ href: 'https://example.com/x' }, 'href'],
      [{ spec: '30' }, 'spec'],
      [{ id: 'Agente En Vivo' }, 'id'],
    ]
    for (const [change, path] of cases) {
      const result = routeStationSchema.safeParse({ ...base, ...change })
      expect(result.success, path).toBe(false)
      if (!result.success) expect(result.error.issues.map((issue) => issue.path.join('.')), path).toContain(path)
    }
    expect(routeStationSchema.safeParse({ ...base, href: 'https://github.com/CHERCED-DEV/CHERCED-WORLD/blob/main/README.md' }).success).toBe(true)
  })

  it('una evidencia sin texto en route.json o una spec que no existe se reportan', () => {
    const station = { ...routeStations[2]!, evidence: ['github-lines', 'captura-inventada'], spec: '999' }
    expect(problemsWith([...routeStations.slice(0, 2), station, ...routeStations.slice(3)])).toEqual([
      'codigo-real: la evidencia captura-inventada no tiene texto en ES y EN en route.json',
      'codigo-real: la spec 999 no existe en specs/',
    ])
  })

  it('US5: la estación de otra línea pasa si cumple el contrato y falla con el motivo si no', () => {
    expect(problemsWith([...routeStations, mcpStation])).toEqual([])
    expect(problemsWith([...routeStations, { ...mcpStation, href: '/mcp/no-existe' }])).toEqual(['mcp-en-vivo: href /mcp/no-existe: la página /mcp/no-existe no existe'])
    expect(problemsWith([...routeStations, { ...mcpStation, id: 'rompelo' }])).toEqual(['rompelo: id repetido'])
  })

  it('US5: una estación nueva de la prueba 1 sale en «Más pruebas» y no alarga la ruta núcleo', () => {
    const before = coreMinutes(routeStations, coreRoute)
    const sections = routeSections([...routeStations, mcpStation], coreRoute)
    expect(sections[0]!.core.id).toBe('agente-en-vivo')
    expect(sections[0]!.more.map((station) => station.id)).toContain('mcp-en-vivo')
    expect(sections[2]!.more.map((station) => station.id)).not.toContain('mcp-en-vivo')
    expect(coreMinutes([...routeStations, mcpStation], coreRoute)).toBe(before)
  })
})
