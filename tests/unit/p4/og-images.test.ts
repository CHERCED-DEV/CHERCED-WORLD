import { describe, expect, it } from 'vitest'
import { generateImageMetadata as caseImages } from '@/app/[lang]/portfolio/[id]/opengraph-image'
import { generateImageMetadata as portfolioImages } from '@/app/[lang]/portfolio/opengraph-image'
import { getProjects } from '@/lib/content'
import { locales } from '@/lib/i18n'

const projects = getProjects()

describe('imágenes OG del portafolio y de cada caso (FR-471, T463)', () => {
  it.each(locales)('el portafolio anuncia sus 15 casos en %s', async (lang) => {
    const [image] = await portfolioImages({ params: Promise.resolve({ lang }) })
    expect(image).toMatchObject({
      id: 'og',
      alt: lang === 'es' ? `Portafolio: ${projects.length} casos de estudio` : `Portfolio: ${projects.length} case studies`,
      size: { width: 1200, height: 630 },
      contentType: 'image/png',
    })
  })

  it.each(locales)('cada caso lleva título y resumen en %s', async (lang) => {
    for (const project of projects) {
      const images = await caseImages({ params: Promise.resolve({ lang, id: project.id }) })
      expect(images, project.id).toEqual([
        { id: 'og', alt: `${project.title}: ${project.summary[lang]}`, size: { width: 1200, height: 630 }, contentType: 'image/png' },
      ])
    }
  })

  it('no inventa imagen para un caso o un idioma que no existen', async () => {
    expect(await caseImages({ params: Promise.resolve({ lang: 'es', id: 'no-existe' }) })).toEqual([])
    expect(await caseImages({ params: { lang: 'fr', id: '12' } })).toEqual([])
    expect(await portfolioImages({ params: { lang: 'fr' } })).toEqual([])
  })
})
