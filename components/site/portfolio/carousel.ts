import { PROJECT_ERAS, type ProjectEra } from '@/content/types'

export type SlideProject = {
  id: string
  order: number
  title: string
  summary: string
  technologies: string[]
  era: ProjectEra
  href: string
  image: { src: string; alt: string; width: number; height: number }
}

export function filterByTechnology<T extends { technologies: readonly string[] }>(items: readonly T[], tech: string | null): T[] {
  if (tech === null) return [...items]
  return items.filter((item) => item.technologies.includes(tech))
}

export function filterByEra<T extends { era: ProjectEra }>(items: readonly T[], era: ProjectEra | null): T[] {
  if (era === null) return [...items]
  return items.filter((item) => item.era === era)
}

export type ProjectFilters = { tech: string | null; era: ProjectEra | null }

export function filterProjects<T extends { technologies: readonly string[]; era: ProjectEra }>(items: readonly T[], filters: ProjectFilters): T[] {
  return filterByEra(filterByTechnology(items, filters.tech), filters.era)
}

export type EraUsage = { era: ProjectEra; count: number }

export function eraUsage(items: readonly { era: ProjectEra }[]): EraUsage[] {
  return PROJECT_ERAS.map((era) => ({ era, count: items.filter((item) => item.era === era).length })).filter((usage) => usage.count > 0)
}

export type TechnologyUsage = { name: string; count: number }

export function technologyUsage(
  items: readonly { technologies: readonly string[]; order?: number }[],
  technologies: readonly string[],
): TechnologyUsage[] {
  const counts = new Map<string, number>()
  const ranks = new Map<string, number>()
  items.forEach((item, position) => {
    const order = item.order ?? position
    item.technologies.forEach((tech, index) => {
      const rank = order * 1000 + index
      if (rank < (ranks.get(tech) ?? Infinity)) ranks.set(tech, rank)
    })
    for (const tech of new Set(item.technologies)) counts.set(tech, (counts.get(tech) ?? 0) + 1)
  })
  return technologies
    .map((name) => ({ name, count: counts.get(name) ?? 0 }))
    .filter((usage) => usage.count > 0)
    .sort((a, b) => (ranks.get(a.name) ?? Infinity) - (ranks.get(b.name) ?? Infinity) || b.count - a.count || a.name.localeCompare(b.name, 'en'))
}

export function chipsFor(technologies: readonly string[], active: string | null, visible: number): { shown: string[]; rest: string[] } {
  const ordered = active && technologies.includes(active) ? [active, ...technologies.filter((tech) => tech !== active)] : [...technologies]
  const limit = ordered.length > visible + 1 ? visible : ordered.length
  return { shown: ordered.slice(0, limit), rest: ordered.slice(limit) }
}

export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

export function stepIndex(current: number, direction: 'prev' | 'next', length: number): number {
  return wrapIndex(current + (direction === 'next' ? 1 : -1), length)
}

export type CarouselKey = 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End'

export function indexForKey(key: string, current: number, length: number): number | null {
  if (length <= 0) return null
  switch (key) {
    case 'ArrowLeft':
      return wrapIndex(current - 1, length)
    case 'ArrowRight':
      return wrapIndex(current + 1, length)
    case 'Home':
      return 0
    case 'End':
      return length - 1
    default:
      return null
  }
}

export function slideStep(first: number | undefined, second: number | undefined, fallback: number): number {
  if (first === undefined || second === undefined || !(second > first)) return fallback
  return second - first
}

export function nearestIndex(scrollLeft: number, slideWidth: number, length: number): number {
  if (length <= 0 || slideWidth <= 0) return 0
  return Math.min(length - 1, Math.max(0, Math.round(Math.abs(scrollLeft) / slideWidth)))
}

export type FilterLabels = { filteredAll: string; filteredOne: string; filteredMany: string }

export function filterSummary(labels: FilterLabels, count: number, tech: string | null): string {
  if (tech === null) return fillTemplate(labels.filteredAll, { count })
  return fillTemplate(count === 1 ? labels.filteredOne : labels.filteredMany, { count, tech })
}

export type CombinedFilterLabels = FilterLabels & { filteredEra: string }

export function filtersSummary(labels: CombinedFilterLabels, count: number, tech: string | null, era: string | null): string {
  if (era === null) return filterSummary(labels, count, tech)
  if (tech === null) return fillTemplate(labels.filteredEra, { count, era })
  return `${filterSummary(labels, count, tech)} · ${era}`
}

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}
