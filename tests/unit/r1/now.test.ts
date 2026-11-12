import { describe, expect, it } from 'vitest'
import { continuousStart, currentRoles, keepSeparators, nowRoles, relatedProject } from '@/components/site/home/now'
import type { CareerEntry, Project } from '@/content/types'
import { getProjects, getSite } from '@/lib/content'

const site = getSite()
const projects = getProjects()

function entry(overrides: Partial<CareerEntry>): CareerEntry {
  return {
    id: 'x',
    company: 'Empresa',
    role: { es: 'Rol', en: 'Role' },
    start: '2020-01',
    end: null,
    description: { es: 'Descripción.', en: 'Description.' },
    ...overrides,
  }
}

describe('"Ahora trabajo en" con el contenido real', () => {
  it('toma el rol actual en Sistecrédito y Synergos Labs, del más reciente al más antiguo', () => {
    const roles = nowRoles(site.about.career, projects, 'es')
    expect(roles.map((role) => role.company)).toEqual(['Sistecrédito', 'Synergos Labs'])
    expect(roles[0]?.role).toBe('Software Solutions Engineer · AI-First')
    expect(roles[1]?.role).toBe('Founder & Software Architect')
  })

  it('cada dato sale de content/site.ts, sin textos inventados', () => {
    for (const lang of ['es', 'en'] as const) {
      for (const role of nowRoles(site.about.career, projects, lang)) {
        const source = site.about.career.find((item) => item.id === role.id)
        expect(source, role.id).toBeDefined()
        expect(role.company).toBe(source?.company)
        expect(role.role.replaceAll(' ', ' ')).toBe(source?.role[lang])
        expect(role.start).toBe(continuousStart(source!, site.about.career))
        expect(source?.end).toBeNull()
      }
    }
  })

  it('enlaza Synergos Labs con su caso de estudio y deja a Sistecrédito sin proyecto', () => {
    const [sistecredito, synergos] = nowRoles(site.about.career, projects, 'en')
    expect(sistecredito?.project).toBeNull()
    expect(synergos?.project?.title).toBe('Synergos')
    expect(projects.some((project) => project.id === synergos?.project?.id)).toBe(true)
  })

  it('R2.7: en Sistecrédito cuenta desde el primer cargo continuo (mar 2025), no desde el AI-First (feb 2026)', () => {
    const [es, synergosEs] = nowRoles(site.about.career, projects, 'es')
    const [en] = nowRoles(site.about.career, projects, 'en')
    expect(es?.role.replaceAll(' ', ' ')).toBe('Software Solutions Engineer · AI-First')
    expect(es?.start).toBe('2025-03')
    expect(es?.since).toMatch(/^mar 2025$/i)
    expect(en?.since).toMatch(/^Mar 2025$/)
    expect(synergosEs?.start).toBe('2024-02')
  })
})

describe('reglas de selección', () => {
  it('R2.7: encadena los cargos de la misma empresa sin huecos de más de un mes', () => {
    const actual = entry({ id: 'actual', company: 'Acme', start: '2026-02' })
    const career = [
      actual,
      entry({ id: 'antes', company: 'Acme', start: '2025-03', end: '2026-01' }),
      entry({ id: 'primero', company: 'ACME ', start: '2023-01', end: '2025-03' }),
      entry({ id: 'otra', company: 'Otra', start: '2020-01', end: '2023-01' }),
    ]
    expect(continuousStart(actual, career)).toBe('2023-01')
    const gap = [actual, entry({ id: 'lejos', company: 'Acme', start: '2024-01', end: '2025-06' })]
    expect(continuousStart(actual, gap), 'un hueco de 8 meses corta la cadena').toBe('2026-02')
  })

  it('descarta los empleos terminados y los pendientes del autor', () => {
    const roles = currentRoles([
      entry({ id: 'fin', end: '2024-01' }),
      entry({ id: 'pendiente', pending: true }),
      entry({ id: 'viejo', start: '2019-05' }),
      entry({ id: 'nuevo', start: '2025-11' }),
    ])
    expect(roles.map((role) => role.id)).toEqual(['nuevo', 'viejo'])
  })

  it('no confunde un proyecto con una empresa que solo comparte el comienzo del nombre', () => {
    const project = { ...projects[0]!, title: 'Syn' } satisfies Project
    expect(relatedProject({ company: 'Synergos Labs' }, [project])).toBeNull()
    expect(relatedProject({ company: 'Syn Labs' }, [project])?.title).toBe('Syn')
    expect(relatedProject({ company: 'SYN' }, [project])?.title).toBe('Syn')
  })

  it('no deja un separador colgando al final de una línea', () => {
    expect(keepSeparators('Software Solutions Engineer · AI-First')).toBe('Software Solutions Engineer · AI-First')
    expect(keepSeparators('Founder & Software Architect')).toBe('Founder & Software Architect')
    expect(keepSeparators('A — B · C')).toBe('A — B · C')
  })

  it('ignora tildes y mayúsculas al comparar', () => {
    const project = { ...projects[0]!, title: 'Sistecredito' } satisfies Project
    expect(relatedProject({ company: 'Sistecrédito' }, [project])?.title).toBe('Sistecredito')
  })
})
