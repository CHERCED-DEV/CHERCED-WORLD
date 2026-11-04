import { describe, expect, it } from 'vitest'
import { chipsFor, technologyUsage } from '@/components/site/portfolio/carousel'
import { caseStudyNeighbors, galleryImages, technologyCounts } from '@/components/site/portfolio/projects'
import { layerOf, STACK_LAYERS, stackGroups } from '@/components/site/portfolio/stack'
import { railOverflow } from '@/components/site/portfolio/useRailOverflow'
import { getAllTechnologies, getProjects } from '@/lib/content'

const projects = getProjects()

describe('filtro en riel', () => {
  it('ordena las tecnologías por uso y luego por nombre, con su conteo real', () => {
    const usage = technologyUsage(projects, getAllTechnologies())
    expect(usage.map((item) => item.name).sort()).toEqual([...getAllTechnologies()].sort())
    for (let i = 1; i < usage.length; i++) {
      const [a, b] = [usage[i - 1]!, usage[i]!]
      expect(a.count > b.count || (a.count === b.count && a.name.localeCompare(b.name, 'en') < 0), `${a.name} antes de ${b.name}`).toBe(true)
    }
    for (const item of usage) {
      expect(item.count, item.name).toBe(projects.filter((project) => project.technologies.includes(item.name)).length)
    }
  })

  it('no cuenta dos veces una tecnología repetida ni ofrece las que no usa nadie', () => {
    const usage = technologyUsage([{ technologies: ['A', 'A', 'B'] }, { technologies: ['A'] }], ['A', 'B', 'C'])
    expect(usage).toEqual([
      { name: 'A', count: 2 },
      { name: 'B', count: 1 },
    ])
  })

  it('detecta desbordes del riel a cada lado', () => {
    expect(railOverflow(0, 1000, 400)).toEqual({ start: false, end: true })
    expect(railOverflow(300, 1000, 400)).toEqual({ start: true, end: true })
    expect(railOverflow(600, 1000, 400)).toEqual({ start: true, end: false })
    expect(railOverflow(0, 400, 400)).toEqual({ start: false, end: false })
  })
})

describe('tecnologías en la tarjeta', () => {
  const techs = ['HTML', 'CSS', 'SASS', 'JAVASCRIPT', 'REACT', 'NEXTJS']

  it('muestra 4 y resume el resto en "+N"', () => {
    expect(chipsFor(techs, null, 4)).toEqual({ shown: techs.slice(0, 4), rest: techs.slice(4) })
  })

  it('pone primero la tecnología del filtro activo', () => {
    expect(chipsFor(techs, 'NEXTJS', 4).shown[0]).toBe('NEXTJS')
    expect(chipsFor(techs, 'COBOL', 4).shown[0]).toBe('HTML')
  })

  it('nunca deja un "+1": si sobra una sola, la muestra', () => {
    expect(chipsFor(techs.slice(0, 5), null, 4)).toEqual({ shown: techs.slice(0, 5), rest: [] })
  })
})

describe('stack visual', () => {
  it('clasifica cada tecnología del contenido en una capa conocida', () => {
    for (const tech of getAllTechnologies()) expect(layerOf(tech), tech).not.toBeNull()
  })

  it('agrupa en el orden de capas y sin duplicados', () => {
    const groups = stackGroups(['FIGMA', 'REACT', 'HTML', 'REACT', 'TYPESCRIPT'])
    expect(groups.map((group) => group.layer)).toEqual(['interface', 'language', 'framework', 'craft'])
    expect(groups.find((group) => group.layer === 'framework')?.technologies).toEqual(['REACT'])
    expect(STACK_LAYERS).toHaveLength(6)
  })

  it('cuenta en cuántos proyectos aparece cada tecnología', () => {
    const counts = technologyCounts(projects)
    expect(counts.REACT).toBe(projects.filter((project) => project.technologies.includes('REACT')).length)
  })
})

describe('navegación entre casos', () => {
  it('enlaza el anterior y el siguiente por orden, dando la vuelta', () => {
    const first = caseStudyNeighbors(projects, projects[0]!.id, 'es')!
    expect(first.prev.id).toBe(projects.at(-1)!.id)
    expect(first.next.id).toBe(projects[1]!.id)
    expect(first.position).toBe(1)
    expect(first.total).toBe(projects.length)
    expect(first.next.href).toBe(`/es/portfolio/${projects[1]!.id}`)
    const last = caseStudyNeighbors(projects, projects.at(-1)!.id, 'en')!
    expect(last.next.id).toBe(projects[0]!.id)
    expect(last.next.href).toBe(`/en/portfolio/${projects[0]!.id}`)
  })

  it('no inventa vecinos para un id que no existe', () => {
    expect(caseStudyNeighbors(projects, 'no-existe', 'es')).toBeNull()
  })
})

describe('galería', () => {
  it('empieza siempre por la captura principal, con su alt localizado', () => {
    for (const project of projects) {
      const images = galleryImages(project, 'es')
      expect(images[0], project.id).toEqual({
        src: project.image.src,
        alt: project.image.alt.es,
        width: project.image.width,
        height: project.image.height,
      })
    }
  })
})
