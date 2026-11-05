import { describe, expect, it } from 'vitest'
import { aboutFigures, fullYearsSince, webSince } from '@/components/site/about/figures'
import { synergosFacts } from '@/content/synergos'
import { getProjects, getSite } from '@/lib/content'

const { about, contact } = getSite()
const NOV_2026 = new Date(Date.UTC(2026, 10, 2))

describe('cifras destacadas (US6), solo públicas y derivadas del contenido', () => {
  it('"desde 2019" sale del primer empleo web y coincide con el texto de contacto', () => {
    expect(webSince(about.career)).toEqual({ year: 2019, month: 1 })
    expect(contact.description.es).toMatch(/desde 2019/)
    expect(contact.description.en).toMatch(/since 2019/)
  })

  it('cuenta años completos y marca el "+" si hay meses de más', () => {
    expect(fullYearsSince({ year: 2019, month: 1 }, NOV_2026)).toEqual({ years: 7, more: true })
    expect(fullYearsSince({ year: 2019, month: 11 }, NOV_2026)).toEqual({ years: 7, more: false })
    expect(fullYearsSince({ year: 2030, month: 1 }, NOV_2026)).toEqual({ years: 0, more: false })
  })

  it('la carrera conserva las aerolíneas de FLYR, pero ya no son una cifra (004, FR-436)', () => {
    const flyr = about.career.find((entry) => entry.id === 'flyr')!
    expect(flyr.description.en).toMatch(/3\+ international airlines/)
    expect(flyr.description.es).toMatch(/más de 3 aerolíneas/)
    expect(aboutFigures(about, NOV_2026).map((figure) => figure.id)).not.toContain('airlines')
  })

  it('arma las cuatro cifras de la 004: años calculados y Synergos desde su fuente única (FR-436)', () => {
    expect(aboutFigures(about, NOV_2026)).toEqual([
      { id: 'years', value: 7, plus: true, since: 2019 },
      { id: 'pieces', value: synergosFacts.pieces, plus: false },
      { id: 'adrs', value: synergosFacts.adrsAtLeast, plus: true },
      { id: 'tests', value: synergosFacts.testsAtLeast, plus: true },
    ])
    expect(getProjects()).toHaveLength(15)
    expect(about.skills.tech).toHaveLength(55)
  })

  it('omite una cifra que no tenga respaldo en vez de inventarla', () => {
    const vacio = { ...about, career: [], skills: { ...about.skills, tech: [], lobes: [] } }
    expect(aboutFigures(vacio, NOV_2026, { pieces: 0, adrsAtLeast: 0, testsAtLeast: 0 })).toEqual([])
  })

  it('no publica cifras confidenciales de Sistecrédito', () => {
    const values = aboutFigures(about, NOV_2026).map((figure) => figure.value)
    for (const value of values) expect([700, 1000, 90]).not.toContain(value)
  })
})
