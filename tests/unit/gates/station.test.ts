import { describe, expect, it } from 'vitest'
import { GATES_CODE_HREF, GATES_EVIDENCE_TEXT, gatesStation } from '@/content/ailab/gates/station'
import { isExternalHref, ROUTE_STEPS_MAX, routeStationSchema } from '@/content/ailab/route/stations'
import { GATES_STATION_ID } from '@/lib/ai/gates/export'

describe('estación «Del pedido a la spec» para la ruta de 10 minutos (046, contrato de la 042)', () => {
  it('prueba 4 que también demuestra la 1, tres minutos, cuatro pasos en ES y EN y el ancla de la tarjeta A12', () => {
    expect(routeStationSchema.parse(gatesStation)).toEqual(gatesStation)
    expect(gatesStation).toMatchObject({ id: 'gates', proof: 4, alsoProves: [1], minutes: 3, spec: '046', href: '/ai-lab#lab-a12' })
    expect(gatesStation.id).toBe(GATES_STATION_ID)
    expect(gatesStation.steps.length).toBeLessThanOrEqual(ROUTE_STEPS_MAX)
    expect(isExternalHref(GATES_CODE_HREF)).toBe(true)
  })

  it('trae el texto de su evidencia en ES y EN para el registro (E-4607, del integrador)', () => {
    for (const id of gatesStation.evidence.filter((item) => item !== 'github-lines')) {
      const text = GATES_EVIDENCE_TEXT[id as keyof typeof GATES_EVIDENCE_TEXT]
      expect(text.es.trim(), id).not.toBe('')
      expect(text.en.trim(), id).not.toBe('')
    }
  })
})
