export type SlideProject = {
  id: string
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
