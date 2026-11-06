import type { CareerEntry, Locale, Project } from '@/content/types'
import { formatMonth } from '@/components/site/format'
import { projectTitle, projectTitles } from '@/lib/content/project-title'

export type NowRole = {
  id: string
  company: string
  role: string
  start: string
  since: string
  project: { id: string; title: string } | null
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
}

export function keepSeparators(text: string): string {
  return text.replace(/ ([\u00b7|\u2014\u2013]) /g, '\u00a0$1 ')
}

export function currentRoles(career: readonly CareerEntry[]): CareerEntry[] {
  return career
    .filter((entry) => entry.end === null && entry.pending !== true)
    .sort((a, b) => b.start.localeCompare(a.start))
}

export function relatedProject(entry: Pick<CareerEntry, 'company'>, projects: readonly Project[]): Project | null {
  const company = normalize(entry.company)
  return (
    projects.find((project) =>
      projectTitles(project).some((value) => {
        const title = normalize(value)
        return title.length > 0 && (company === title || company.startsWith(`${title} `))
      }),
    ) ?? null
  )
}

export function nowRoles(career: readonly CareerEntry[], projects: readonly Project[], lang: Locale): NowRole[] {
  return currentRoles(career).map((entry) => {
    const project = relatedProject(entry, projects)
    return {
      id: entry.id,
      company: entry.company,
      role: keepSeparators(entry.role[lang]),
      start: entry.start,
      since: formatMonth(entry.start, lang),
      project: project ? { id: project.id, title: projectTitle(project, lang) } : null,
    }
  })
}

export function splitAround(template: string, token: string): [string, string] {
  const marker = `{${token}}`
  const index = template.indexOf(marker)
  if (index === -1) return [`${template.trimEnd()} `, '']
  return [template.slice(0, index), template.slice(index + marker.length)]
}
