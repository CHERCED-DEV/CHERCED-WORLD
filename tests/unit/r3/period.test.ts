import { describe, expect, it } from 'vitest'
import { formatPeriod, periodParts } from '@/components/site/format'
import { getSite } from '@/lib/content'

describe('fechas de la línea de tiempo', () => {
  it('separa inicio y fin con su valor para <time datetime>', () => {
    expect(periodParts('2023-03', '2025-03', 'es')).toEqual({
      start: { dateTime: '2023-03', label: 'mar 2023' },
      end: { dateTime: '2025-03', label: 'mar 2025' },
      current: false,
    })
    expect(periodParts('2024-02', null, 'en')).toEqual({
      start: { dateTime: '2024-02', label: 'Feb 2024' },
      end: null,
      current: true,
    })
    expect(periodParts('2013', '2017', 'es').start).toEqual({ dateTime: '2013', label: '2013' })
  })

  it('cada fecha de carrera y educación es un valor válido de <time>', () => {
    const { career, education } = getSite().about
    for (const entry of [...career, ...education]) {
      for (const value of [entry.start, entry.end].filter((item): item is string => item !== null)) {
        expect(value, entry.id).toMatch(/^\d{4}(-(0[1-9]|1[0-2]))?$/)
      }
    }
  })

  it('el texto visible coincide con el formato de período de 2023', () => {
    const parts = periodParts('2022-07', null, 'es')
    expect(`${parts.start.label} – Actualidad`).toBe(formatPeriod('2022-07', null, 'es', 'Actualidad'))
  })

  it('la carrera tiene los 8 empleos, del más nuevo al más viejo por fecha de inicio', () => {
    const { career } = getSite().about
    expect(career).toHaveLength(8)
    const starts = career.map((entry) => entry.start)
    expect([...starts].sort().reverse()).toEqual(starts)
  })
})
