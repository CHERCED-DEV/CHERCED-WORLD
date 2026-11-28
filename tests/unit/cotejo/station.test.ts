import { describe, expect, it } from 'vitest'
import { COTEJO_CASE_PENDING, COTEJO_RESEARCH_HREF, cotejoCase } from '@/content/ailab/cotejo/case'
import { COTEJO_EVIDENCE_TEXT, COTEJO_REPO_HREF, cotejoStation } from '@/content/ailab/cotejo/station'
import { coreRoute, routeStations } from '@/content/ailab/route'
import { isExternalHref, routeStationSchema } from '@/content/ailab/route/stations'
import { routeRegistryProblems } from '@/lib/ailab/route/registry'
import { registryEnv } from '../route/support'

describe('estación «cotejo» para la ruta de 10 minutos (047, contrato de la 042)', () => {
  it('prueba 2 que también demuestra la 3 y la 4, dos minutos y los cuatro pasos de la spec en ES y EN', () => {
    expect(routeStationSchema.parse(cotejoStation)).toEqual(cotejoStation)
    expect(cotejoStation).toMatchObject({ id: 'cotejo', proof: 2, alsoProves: [3, 4], minutes: 2, spec: '047', href: '/ai-lab#lab-a11' })
    expect(cotejoStation.steps).toHaveLength(4)
    expect(cotejoStation.steps.map((step) => step.es).join(' ')).toMatch(/muestra[\s\S]*contradicción[\s\S]*posiblemente implementado[\s\S]*precisión y el recall[\s\S]*SARIF/)
    expect(isExternalHref(COTEJO_REPO_HREF)).toBe(true)
  })

  it('cuando el integrador la sume con sus textos de evidencia (E-4707), el registro no tendrá problemas', () => {
    const env = registryEnv()
    expect(env.anchors.has('/ai-lab#lab-a11')).toBe(true)
    expect(Object.keys(COTEJO_EVIDENCE_TEXT).sort()).toEqual([...cotejoStation.evidence].sort())
    for (const text of Object.values(COTEJO_EVIDENCE_TEXT)) {
      expect(text.es.trim()).not.toBe('')
      expect(text.en.trim()).not.toBe('')
    }
    const withCotejo = routeStations.some((station) => station.id === 'cotejo') ? routeStations : [...routeStations, cotejoStation]
    const evidence = new Set([...env.evidence, ...Object.keys(COTEJO_EVIDENCE_TEXT)])
    expect(routeRegistryProblems(withCotejo, coreRoute, { ...env, evidence })).toEqual([])
  })
})

describe('texto del caso de estudio para el integrador (T4737, E-4706, FR-4717)', () => {
  it('trae el problema, la decisión central, los números, lo que no funcionó y los enlaces, en ES y EN', () => {
    expect(cotejoCase.context.es).toMatch(/10\.000 líneas/)
    expect(cotejoCase.decisions?.es).toMatch(/Determinista primero[\s\S]*Ningún token de LLM/)
    expect(cotejoCase.result?.es).toMatch(/1,00[\s\S]*Lo que no funcionó: BM25 sin un puente[\s\S]*NLI/)
    expect(cotejoCase.result?.en).toMatch(/What did not work/)
    expect(cotejoCase.links.github).toBe(COTEJO_REPO_HREF)
    expect(COTEJO_RESEARCH_HREF).toMatch(/specs\/014-gestor-de-specs\/propuesta\.md$/)
    expect(cotejoCase.era).toBe('2026')
  })

  it('dice qué métricas faltan antes de publicarlo (P-4711), y no nombra empresas', () => {
    expect(COTEJO_CASE_PENDING.map((item) => item.id)).toEqual(['P-4705', 'FR-4714', 'SC-4704', 'SC-4710'])
    const corpus = JSON.stringify(cotejoCase)
    for (const pattern of [/sistecr/i, /factor[ií]a/i, /azure devops/i]) expect(corpus).not.toMatch(pattern)
  })
})
