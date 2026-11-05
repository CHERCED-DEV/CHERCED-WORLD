import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CaseStudy, EMBED_ANCHOR, type CaseStudyExtraLabels } from '@/components/site/portfolio/CaseStudy'
import { caseStudyNeighbors, technologyCounts, type CaseStudyLabels } from '@/components/site/portfolio/projects'
import type { Project } from '@/content/types'
import { getProject, getProjects } from '@/lib/content'

const labels: CaseStudyLabels = {
  context: 'Contexto',
  role: 'Mi rol',
  decisions: 'Decisiones clave',
  result: 'Resultado',
  technologies: 'Tecnologías de este proyecto',
  links: 'Enlaces del proyecto',
  live: 'En vivo',
  github: 'GitHub',
  newTab: '(se abre en una pestaña nueva)',
}

const extra: CaseStudyExtraLabels = {
  eyebrow: 'Caso de estudio {n} / {total}',
  highlights: 'Resultados destacados',
  seeLive: 'Verlo en vivo aquí',
  stackIntro: 'Cada pieza, en su capa.',
  layers: {
    interface: 'Interfaz',
    language: 'Lenguajes',
    framework: 'Frameworks',
    data: 'Estado y datos',
    architecture: 'Arquitectura',
    craft: 'Diseño y herramientas',
  },
  usage: 'En {count} proyectos',
  usageOne: 'Solo en este proyecto',
  pager: 'Más casos de estudio',
  prev: 'Anterior',
  next: 'Siguiente',
  all: 'Todos los proyectos',
  gallery: {
    zoom: 'Ampliar captura',
    close: 'Cerrar',
    prev: 'Captura anterior',
    next: 'Captura siguiente',
    counter: '{n} de {total}',
    thumb: 'Ver captura {n} de {total}',
  },
  embed: {
    heading: 'Sitio en vivo',
    intro: 'Explóralo aquí mismo.',
    load: 'Cargar el sitio',
    open: 'Abrir en vivo',
    loading: 'Cargando {host}…',
    ready: 'Sitio cargado',
    reload: 'Recargar',
    openLive: 'Abrir el sitio en una pestaña nueva',
    expand: 'Pantalla completa',
    collapse: 'Salir de pantalla completa',
    view: 'Vista',
    desktop: 'Escritorio',
    mobile: 'Móvil',
    frame: '{title}, sitio en vivo',
    slowTitle: 'El sitio está tardando',
    slowBody: 'Mientras tanto, esta es su captura.',
    retry: 'Reintentar',
    close: 'Cerrar',
    noScript: 'Sin JavaScript no se puede embeber.',
  },
}

const projects = getProjects()

function render(id: string, overrides: Partial<Project> = {}): string {
  const base = getProject(id)
  if (!base) throw new Error(`Falta el proyecto ${id}`)
  const project = { ...base, ...overrides }
  return renderToStaticMarkup(
    createElement(CaseStudy, {
      project,
      lang: 'es',
      labels,
      extras: {
        labels: extra,
        neighbors: caseStudyNeighbors(projects, project.id, 'es'),
        usage: technologyCounts(projects),
        portfolioHref: '/es/portfolio',
      },
    }),
  )
}

describe('caso de estudio enriquecido (US5)', () => {
  it('ofrece el embebido solo a los proyectos con sitio en vivo', () => {
    for (const project of projects) {
      const html = render(project.id)
      if (project.links.live) {
        expect(html, project.id).toContain('data-cw-embed=""')
        expect(html, project.id).toContain(`id="${EMBED_ANCHOR}"`)
        expect(html, project.id).toContain(`href="#${EMBED_ANCHOR}"`)
      } else {
        expect(html, project.id).not.toContain('data-cw-embed')
        expect(html, project.id).not.toContain('data-cw-case-see-live')
      }
    }
  })

  it('nunca pinta el iframe en el render del servidor', () => {
    for (const project of projects) expect(render(project.id), project.id).not.toContain('<iframe')
  })

  it('abre el sitio afuera solo como acción secundaria en pestaña nueva', () => {
    const html = render('1')
    const anchors = [...html.matchAll(/<a [^>]*data-cw-embed-open=""[^>]*>/g)].map((match) => match[0])
    expect(anchors.length).toBeGreaterThan(0)
    for (const tag of anchors) {
      expect(tag).toContain('href="https://quantic-theatrum.vercel.app/"')
      expect(tag).toContain('target="_blank"')
      expect(tag).toContain('rel="noopener noreferrer"')
      expect(tag).toContain('aria-label="Abrir el sitio en una pestaña nueva"')
    }
  })

  it('conserva Live y GitHub en el orden de siempre y un único h1', () => {
    const html = render('1')
    expect([...html.matchAll(/data-cw-case-link="(live|github)"/g)].map((match) => match[1])).toEqual(['live', 'github'])
    expect(html.match(/<h1\b/g)).toHaveLength(1)
  })

  it('muestra el resumen, la posición y la galería con su captura principal', () => {
    const html = render('3')
    const project = getProject('3')!
    expect(html).toContain(project.summary.es)
    const position = projects.findIndex((item) => item.id === '3') + 1
    expect(html).toContain(`Caso de estudio ${String(position).padStart(2, '0')} / ${projects.length}`)
    expect(html).toContain('data-cw-gallery=""')
    expect(html).toContain(`alt="${project.image.alt.es}"`)
  })

  it('arma el stack por capas con cada tecnología y su uso real', () => {
    const project = getProject('12')!
    const html = render('12')
    for (const tech of project.technologies) expect(html).toContain(`data-cw-stack-piece="${tech}"`)
    expect(html).toContain('Arquitectura')
    expect(html).toContain('Solo en este proyecto')
    const react = render('1')
    expect(react).toContain(`En ${technologyCounts(projects).REACT} proyectos`)
  })

  it('pinta los resultados destacados solo si existen', () => {
    expect(render('6', { highlights: undefined } as Partial<Project>)).not.toContain('data-cw-case-highlights')
    const html = render('6', { highlights: [{ es: 'Uno', en: 'One' }, { es: 'Dos', en: 'Two' }] } as Partial<Project>)
    expect(html).toMatch(/data-cw-case-highlights=""[\s\S]*<ol[^>]*>[\s\S]*Uno[\s\S]*Dos/)
  })

  it('enlaza el caso anterior, el siguiente y el portafolio', () => {
    const html = render('1')
    const index = projects.findIndex((item) => item.id === '1')
    const at = (offset: number) => projects[(index + offset + projects.length) % projects.length]!.id
    expect(html).toContain(`data-cw-case-prev="${at(-1)}"`)
    expect(html).toContain(`data-cw-case-next="${at(1)}"`)
    const first = render(projects[0]!.id)
    expect(first).toContain(`data-cw-case-prev="${projects.at(-1)!.id}"`)
    expect(html.match(/<a [^>]*data-cw-case-all[^>]*>/)?.[0]).toContain('href="/es/portfolio"')
  })
})
