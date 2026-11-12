import type { Project } from '@/content/types'

export const FEATURED_LIMIT = 3

export function featuredProjects(projects: readonly Project[], exclude: readonly string[], limit = FEATURED_LIMIT): Project[] {
  const skip = new Set(exclude)
  return [...projects]
    .sort((a, b) => a.order - b.order)
    .filter((project) => !skip.has(project.id))
    .slice(0, Math.max(0, limit))
}
