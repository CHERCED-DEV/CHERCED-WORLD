export type SlideProject = {
  id: string
  order: number
  title: string
  summary: string
  technologies: string[]
  href: string
  image: { src: string; alt: string; width: number; height: number }
}

export function filterByTechnology<T extends { technologies: readonly string[] }>(items: readonly T[], tech: string | null): T[] {
  if (tech === null) return [...items]
  return items.filter((item) => item.technologies.includes(tech))
}

export type TechnologyUsage = { name: string; count: number }

export function technologyUsage(items: readonly { technologies: readonly string[] }[], technologies: readonly string[]): TechnologyUsage[] {
  const counts = new Map<string, number>()
  for (const item of items) for (const tech of new Set(item.technologies)) counts.set(tech, (counts.get(tech) ?? 0) + 1)
  return technologies
    .map((name) => ({ name, count: counts.get(name) ?? 0 }))
    .filter((usage) => usage.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en'))
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

export function nearestIndex(scrollLeft: number, slideWidth: number, length: number): number {
  if (length <= 0 || slideWidth <= 0) return 0
  return Math.min(length - 1, Math.max(0, Math.round(Math.abs(scrollLeft) / slideWidth)))
}

export type FilterLabels = { filteredAll: string; filteredOne: string; filteredMany: string }

export function filterSummary(labels: FilterLabels, count: number, tech: string | null): string {
  if (tech === null) return fillTemplate(labels.filteredAll, { count })
  return fillTemplate(count === 1 ? labels.filteredOne : labels.filteredMany, { count, tech })
}

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}
