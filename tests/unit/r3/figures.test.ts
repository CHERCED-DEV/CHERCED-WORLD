import { describe, expect, it } from 'vitest'
import { aboutFigures, airlinesFromCareer, fullYearsSince, webSince } from '@/components/site/about/figures'
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

  it('las aerolíneas solo aparecen si el texto de la carrera las respalda', () => {
    expect(airlinesFromCareer(about.career)).toBe(3)
    const flyr = about.career.find((entry) => entry.id === 'flyr')!
    expect(flyr.description.en).toMatch(/3\+ international airlines/)
    expect(flyr.description.es).toMatch(/más de 3 aerolíneas/)
    const sinTexto = about.career.map((entry) => ({ ...entry, description: { es: 'x', en: 'x' } }))
    expect(airlinesFromCareer(sinTexto)).toBeNull()
  })

  it('arma las cuatro cifras con proyectos y tecnologías reales', () => {
    expect(aboutFigures(about, getProjects().length, NOV_2026)).toEqual([
      { id: 'years', value: 7, plus: true, since: 2019 },
      { id: 'projects', value: getProjects().length, plus: false },
      { id: 'technologies', value: about.skills.tech.length, plus: false },
      { id: 'airlines', value: 3, plus: true },
    ])
    expect(getProjects()).toHaveLength(12)
    expect(about.skills.tech).toHaveLength(18)
  })

  it('omite una cifra que no tenga respaldo en vez de inventarla', () => {
    const vacio = { ...about, career: [], skills: { ...about.skills, tech: [] } }
    expect(aboutFigures(vacio, 0, NOV_2026)).toEqual([])
  })

  it('no publica cifras confidenciales de Sistecrédito', () => {
    const values = aboutFigures(about, getProjects().length, NOV_2026).map((figure) => figure.value)
    for (const value of values) expect([700, 1000, 90]).not.toContain(value)
  })
})
