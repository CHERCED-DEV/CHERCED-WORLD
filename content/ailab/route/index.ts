import { arenaStation } from '@/content/ailab/arena/station'
import { gatesStation } from '@/content/ailab/gates/station'
import { engineeringStation } from '@/content/engineering/station'
import { mcpStation } from '@/content/mcp/station'
import { coreStations, extraStations } from './core'
import type { RouteProof, RouteStation } from './stations'

export const routeStations: readonly RouteStation[] = [...coreStations, ...extraStations, mcpStation, engineeringStation, arenaStation, gatesStation]

export const coreRoute: Readonly<Record<RouteProof, string>> = {
  1: 'agente-en-vivo',
  2: 'encaje-y-pitch',
  3: 'codigo-real',
  4: 'tablero-en-numeros',
}

export { routeGuides, type RouteGuide, type RouteGuideLink } from './core'
export { ROUTE_PROOFS, routeStationSchema, type RouteProof, type RouteStation } from './stations'
