import { describe, expect, it } from 'vitest'
import { ARENA_EVIDENCE_TEXT, ARENA_PORT_HREF, arenaStation } from '@/content/ailab/arena/station'
import { routeStations } from '@/content/ailab/route'
import { isExternalHref, routeStationSchema } from '@/content/ailab/route/stations'
import { routeRegistryProblems } from '@/lib/ailab/route/registry'
import { coreRoute } from '@/content/ailab/route'
import { registryEnv } from '../route/support'

describe('estación «arena» para la ruta de 10 minutos (043, contrato de la 042)', () => {
  it('prueba 1 que también demuestra la 3, dos minutos, tres pasos en ES y EN', () => {
    expect(routeStationSchema.parse(arenaStation)).toEqual(arenaStation)
    expect(arenaStation).toMatchObject({ id: 'arena', proof: 1, alsoProves: [3], minutes: 2, spec: '043', href: '/ai-lab#lab-a10' })
    expect(arenaStation.steps).toHaveLength(3)
    expect(isExternalHref(ARENA_PORT_HREF)).toBe(true)
  })

  it('el integrador la sumó al registro con su texto de evidencia (E-4315) y el registro no tiene problemas', () => {
    const env = registryEnv()
    expect(env.anchors.has('/ai-lab#lab-a10')).toBe(true)
    expect(routeStations.filter((station) => station.id === 'arena')).toEqual([arenaStation])
    for (const id of Object.keys(ARENA_EVIDENCE_TEXT)) expect(env.evidence.has(id)).toBe(true)
    expect(routeRegistryProblems(routeStations, coreRoute, env)).toEqual([])
  })
})
