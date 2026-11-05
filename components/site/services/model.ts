import type { Project, ServiceId } from '@/content/types'
import { localizedPath, type Locale } from '@/lib/i18n'

export const SERVICE_PARAM = 'servicio'

export function serviceNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function wantHref(lang: Locale, id: ServiceId): string {
  return `${localizedPath(lang, '/contactMe')}?${SERVICE_PARAM}=${encodeURIComponent(id)}`
}

export type StepParts = { name: string | null; text: string }

const STEP = /^\s*\d+\.\s*(.+?)\s+—\s+(.+)$/s

export function stepParts(step: string): StepParts {
  const match = STEP.exec(step)
  if (!match) return { name: null, text: step.replace(/^\s*\d+\.\s*/, '') }
  return { name: match[1] ?? null, text: match[2] ?? '' }
}

export const SERVICE_CASES: Readonly<Partial<Record<ServiceId, readonly string[]>>> = {
  'ai-harness': ['14'],
  'software-factory': ['13', '2'],
  architecture: ['12', '15'],
  product: ['2'],
}

export type ServiceCase = { project: Project; services: ServiceId[] }

export function serviceCases(
  projects: readonly Project[],
  order: readonly ServiceId[],
  map: Readonly<Partial<Record<ServiceId, readonly string[]>>> = SERVICE_CASES,
): ServiceCase[] {
  const byId = new Map(projects.map((project) => [project.id, project]))
  const cases = new Map<string, ServiceCase>()
  for (const service of order) {
    for (const id of map[service] ?? []) {
      const project = byId.get(id)
      if (!project) continue
      const entry = cases.get(id) ?? { project, services: [] }
      if (!entry.services.includes(service)) entry.services.push(service)
      cases.set(id, entry)
    }
  }
  return [...cases.values()].sort((a, b) => a.project.order - b.project.order)
}
