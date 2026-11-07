import { describe, expect, it } from 'vitest'
import { aboutFigures } from '@/components/site/about/figures'
import { synergosFacts } from '@/content/synergos'
import { getProjects, getSite } from '@/lib/content'

const { about, contact } = getSite()
describe('cifras destacadas (US6), solo públicas y derivadas del contenido', () => {
  it('C3: los años son el dato del CV (6), fijo, y Contacto dice lo mismo sin "desde 2019"', () => {
    expect(about.experienceYears).toBe(6)
    expect(contact.description.es).toMatch(/Llevo 6 años construyendo para la web/)
    expect(contact.description.en).toMatch(/for 6 years/)
    expect(contact.description.es).not.toMatch(/desde 2019/)
    expect(contact.description.en).not.toMatch(/since 2019/)
  })

  it('la carrera conserva las aerolíneas de FLYR, pero ya no son una cifra (004, FR-436)', () => {
    const flyr = about.career.find((entry) => entry.id === 'flyr')!
    expect(flyr.description.en).toMatch(/3\+ international airlines/)
    expect(flyr.description.es).toMatch(/más de 3 aerolíneas/)
    expect(aboutFigures(about).map((figure) => figure.id)).not.toContain('airlines')
  })

  it('arma las cuatro cifras de la 004: años del CV y Synergos desde su fuente única (FR-436, C3)', () => {
    expect(aboutFigures(about)).toEqual([
      { id: 'years', value: 6, plus: false },
      { id: 'pieces', value: synergosFacts.pieces, plus: false },
      { id: 'adrs', value: synergosFacts.adrsAtLeast, plus: true },
      { id: 'tests', value: synergosFacts.testsAtLeast, plus: true },
    ])
    expect(getProjects()).toHaveLength(15)
    expect(about.skills.tech).toHaveLength(55)
  })

  it('omite una cifra que no tenga respaldo en vez de inventarla', () => {
    const vacio = { ...about, experienceYears: undefined }
    expect(aboutFigures(vacio, { pieces: 0, adrsAtLeast: 0, testsAtLeast: 0 })).toEqual([])
  })

  it('no publica cifras confidenciales de Sistecrédito', () => {
    const values = aboutFigures(about).map((figure) => figure.value)
    for (const value of values) expect([700, 1000, 90]).not.toContain(value)
  })
})
