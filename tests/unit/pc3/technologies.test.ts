import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { BrainScene } from '@/components/site/about/BrainScene'
import { brainData, projectsForSkills } from '@/components/site/about/brain'
import { CaseStudy, type CaseStudyExtraLabels } from '@/components/site/portfolio/CaseStudy'
import { technologyCounts, type CaseStudyLabels } from '@/components/site/portfolio/projects'
import {
  exactTechnology,
  familyOf,
  findTechnology,
  TECHNOLOGIES,
  technologyFamily,
  technologyName,
  technologyParts,
} from '@/content/technologies'
import type { Project } from '@/content/types'
import { listProjects } from '@/lib/capabilities/handlers'
import { getProject, getProjects, getSite } from '@/lib/content'
import { buildSearchIndex } from '@/lib/search/build-index'

vi.mock('@/content/posts/registry', async () => {
  const { registryFromDisk } = await import('../l5/support/mdx-registry')
  return { postRegistry: registryFromDisk() }
})

const projects = getProjects()
const { about } = getSite()

function projectsInFamily(tech: string): string[] {
  const family = technologyFamily(tech)
  return projects.filter((project) => project.technologies.some((name) => technologyFamily(name) === family)).map((project) => project.id)
}

describe('catálogo único de tecnologías (FR-723)', () => {
  it('ids únicos, familias que existen y alias sin choques', () => {
    const ids = TECHNOLOGIES.map((technology) => technology.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const technology of TECHNOLOGIES) {
      if (technology.family) expect(ids, technology.id).toContain(technology.family)
      if (technology.family) expect(familyOf(technology.family), technology.id).toBe(technology.family)
      for (const alias of [technology.name, ...(technology.aliases ?? [])]) expect(findTechnology(alias)?.id, alias).toBe(technology.id)
    }
  })

  it('cubre cada tecnología de los proyectos y cada parte de cada skill', () => {
    for (const project of projects) for (const tech of project.technologies) expect(exactTechnology(tech), `${project.id}: ${tech}`).not.toBeNull()
    for (const skill of about.skills.tech) {
      for (const part of technologyParts(skill.name)) expect(exactTechnology(part), `${skill.id}: ${part}`).not.toBeNull()
    }
  })

  it('.NET = .NET 8 = ASP.NET CORE → familia .NET, y lo mismo con Umbraco, HTML5 y Spec Kit', () => {
    for (const name of ['.NET', '.NET 8', 'ASP.NET CORE', 'ASP.NET Core', '.NET · ASP.NET CORE', 'dotnet']) expect(technologyFamily(name), name).toBe('dotnet')
    expect(technologyFamily('UMBRACO 13')).toBe(technologyFamily('UMBRACO'))
    expect(technologyFamily('HTML5')).toBe(technologyFamily('HTML'))
    expect(technologyFamily('SPEC KIT')).toBe(technologyFamily('SPEC-DRIVEN DEVELOPMENT'))
    expect(technologyFamily('CLAUDE CODE')).toBe(technologyFamily('AI CODING AGENTS'))
    expect(technologyFamily('C#')).not.toBe(technologyFamily('.NET'))
  })

  it('da el nombre tal como se escribe, también en las skills compuestas', () => {
    expect(technologyName('.NET 8')).toBe('.NET 8')
    expect(technologyName('ASP.NET CORE')).toBe('ASP.NET Core')
    expect(technologyName('NX')).toBe('Nx')
    expect(technologyName('NEXTJS')).toBe('Next.js')
    expect(technologyName('.NET · ASP.NET CORE')).toBe('.NET · ASP.NET Core')
    expect(technologyName('GITHUB ACTIONS · CI/CD')).toBe('GitHub Actions · CI/CD')
    expect(technologyName('TESTING · XUNIT · VITEST · PLAYWRIGHT')).toBe('Testing · xUnit · Vitest · Playwright')
    expect(technologyName('MongoDB')).toBe('MongoDB')
    expect(technologyName('ALGO NUEVO')).toBe('ALGO NUEVO')
  })
})

describe('conteos "en N proyectos" calculados desde el catálogo (B8)', () => {
  const counts = technologyCounts(projects)

  it('.NET en Puente de eventos ya no sale como "solo en este proyecto"', () => {
    expect(getProject('15')!.technologies).toContain('.NET')
    expect(getProject('12')!.technologies).toEqual(expect.arrayContaining(['.NET 8', 'ASP.NET CORE']))
    expect(counts['.NET']).toBe(2)
    expect(counts['.NET 8']).toBe(2)
    expect(counts['ASP.NET CORE']).toBe(2)
  })

  it('Claude Code cuenta CHERCED-WORLD, Synergos, Director y líneas y Espacio de trabajo legal', () => {
    expect(projectsInFamily('CLAUDE CODE').sort()).toEqual(['12', '13', '14', '2'])
    expect(counts['CLAUDE CODE']).toBe(4)
  })

  it('cada conteo es el número de proyectos de su familia', () => {
    for (const project of projects) for (const tech of project.technologies) expect(counts[tech], tech).toBe(projectsInFamily(tech).length)
    expect(counts['UMBRACO 13']).toBe(1)
    expect(counts.REACT).toBe(projects.filter((project) => project.technologies.includes('REACT')).length)
  })

  it('el caso Puente de eventos pinta ".NET · En 2 proyectos"', () => {
    const labels = { context: 'Contexto', role: 'Rol', decisions: 'Decisiones', result: 'Resultado', technologies: 'Tecnologías', links: 'Enlaces', live: 'En vivo', github: 'GitHub', newTab: '(pestaña nueva)' } satisfies CaseStudyLabels
    const extra = {
      eyebrow: '{n} / {total}',
      highlights: 'Resultados',
      seeLive: 'En vivo',
      stackIntro: 'Stack',
      layers: { interface: 'Interfaz', language: 'Lenguajes', framework: 'Frameworks', data: 'Datos', architecture: 'Arquitectura', craft: 'Herramientas' },
      usage: 'En {count} proyectos',
      usageOne: 'Solo en este proyecto',
      pager: 'Más',
      prev: 'Anterior',
      next: 'Siguiente',
      all: 'Todos',
      gallery: { zoom: 'z', close: 'c', prev: 'p', next: 'n', counter: '{n}/{total}', thumb: '{n}/{total}' },
      embed: {
        heading: 'h', intro: 'i', load: 'l', open: 'o', loading: '{host}', ready: 'r', reload: 'r', openLive: 'o', expand: 'e',
        collapse: 'c', view: 'v', desktop: 'd', mobile: 'm', frame: '{title}', slowTitle: 's', slowBody: 's', retry: 'r', close: 'c', noScript: 'n',
      },
    } satisfies CaseStudyExtraLabels
    const html = renderToStaticMarkup(
      createElement(CaseStudy, {
        project: getProject('15')!,
        lang: 'es',
        labels,
        extras: { labels: extra, neighbors: null, usage: counts, portfolioHref: '/es/portfolio' },
      }),
    )
    expect(html).toMatch(/data-cw-stack-piece="\.NET"[^>]*>(?:(?!<\/li>).)*En 2 proyectos/s)
  })
})

describe('mapa cerebral y capacidades con el catálogo', () => {
  it('cruza skills con proyectos por familia', () => {
    const list = [{ id: '1', title: 'P1', technologies: ['.NET 8'], order: 1 }, { id: '2', title: 'P2', technologies: ['HTML'], order: 2 }] as unknown as Project[]
    expect(projectsForSkills([{ id: 'dotnet', name: '.NET · ASP.NET CORE' }], list)).toEqual([{ id: '1', title: 'P1' }])
    expect(projectsForSkills([{ id: 'html5', name: 'HTML5' }], list)).toEqual([{ id: '2', title: 'P2' }])
  })

  it('list_projects con ".NET" trae Synergos y Puente de eventos', async () => {
    const index = await buildSearchIndex('es')
    const result = listProjects(index, { technology: '.NET' }, { origin: null })
    expect(result.projects.map((project) => project.id).sort()).toEqual(['12', '15'])
  })
})

describe('el lóbulo "Idiomas y negocio" dice el nivel del inglés (FR-722)', () => {
  it('el inglés lleva su nivel y la barra conserva el valor', () => {
    for (const [lang, level] of [['es', 'B1, B2 en uso profesional frecuente'], ['en', 'B1, B2 in regular professional use']] as const) {
      const business = brainData(about, projects, lang, '').lobes.find((lobe) => lobe.id === 'business')!
      const english = business.skills.find((skill) => skill.id === 'en')!
      expect(english.levelLabel).toBe(level)
      expect(english.level).toBe(65)
      expect(business.skills.find((skill) => skill.id === 'es')!.levelLabel).toBeUndefined()
    }
  })

  it('la escena pinta el nivel junto a INGLÉS y no el porcentaje', () => {
    const html = renderToStaticMarkup(
      createElement(BrainScene, {
        lang: 'es',
        about,
        projects,
        labels: {
          level: (value: number) => `${value} %`,
          present: 'actualidad',
          map: {
            lobes: 'Lóbulos',
            sources: 'Fuentes',
            sourcesWord: 'fuentes',
            appliedWord: 'aplicado',
            projectsWord: 'proyectos',
            principles: 'Principios',
            words: 'En palabras',
            feeds: 'alimenta',
            core: 'CAMILO',
            path: '~/skills',
            platzi: { href: 'https://platzi.com/p/Cherced/', label: 'Platzi', newTab: '(pestaña nueva)' },
            terminal: { input: 'Comando', hint: 'help', output: 'Salida' },
            sheet: { close: 'Cerrar', prev: 'Anterior', next: 'Siguiente' },
          },
        },
      }),
    )
    const row = html.match(/data-cw-brain-skill="en"(?:(?!<\/li>).)*/s)?.[0] ?? ''
    expect(row).toContain('INGLÉS')
    expect(row).toContain('B1, B2 en uso profesional frecuente')
    expect(row).not.toContain('65 %')
  })
})
