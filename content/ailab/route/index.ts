import { mcpStation } from '@/content/mcp/station'
import { coreStations, extraStations } from './core'
import type { RouteProof, RouteStation } from './stations'

export const routeStations: readonly RouteStation[] = [...coreStations, ...extraStations, mcpStation]

export const coreRoute: Readonly<Record<RouteProof, string>> = {
  1: 'agente-en-vivo',
  2: 'encaje-y-pitch',
  3: 'codigo-real',
  4: 'de-spec-a-commit',
}

export { routeGuides, type RouteGuide, type RouteGuideLink } from './core'
export { ROUTE_PROOFS, routeStationSchema, type RouteProof, type RouteStation } from './stations'
