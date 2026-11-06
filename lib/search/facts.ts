import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { PAGE_PATHS } from './pages'
import type { ProjectFact } from './types'

export const LOBE_ANCHOR_PREFIX = 'lobe-'

export function lobeUrl(lang: Locale, lobeId: string): string {
  return `${localizedPath(lang, PAGE_PATHS.about)}#${LOBE_ANCHOR_PREFIX}${encodeURIComponent(lobeId)}`
}

export function projectDetails(project: ProjectFact): string[] {
  return [
    project.context,
    project.role,
    project.decisions,
    ...project.adrs.map((adr) => `${adr.decision}. ${adr.why} ${adr.tradeoff}`),
    project.result,
  ].filter((value): value is string => value !== null)
}
