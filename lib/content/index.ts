import type { ComponentType } from 'react'
import { capsule } from '@/content/capsule'
import { postRegistry } from '@/content/posts/registry'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import type { CapsuleEntry, Locale, Localized, PostMeta, Project, SiteContent } from '@/content/types'
import { tagsIn } from '@/lib/blog/tags'
import { otherLocale } from '@/lib/i18n/config'

export type ListedPost = PostMeta & { fallback: boolean }

export type LoadedPost = { Content: ComponentType; meta: PostMeta; fallback: boolean }

export function getSite(): SiteContent {
  return site
}

export function getProjects(): Project[] {
  return [...projects].sort((a, b) => a.order - b.order)
}

export function getProject(id: string): Project | null {
  return projects.find((project) => project.id === id) ?? null
}

export function getAllTechnologies(): string[] {
  return [...new Set(projects.flatMap((project) => project.technologies))].sort((a, b) => a.localeCompare(b, 'en'))
}

export function getCapsule(): CapsuleEntry[] {
  return [...capsule].sort((a, b) => a.date.localeCompare(b.date))
}

export function postIds(): string[] {
  return Object.keys(postRegistry)
}

export function pick<T>(value: Localized<T>, lang: Locale): T {
  return value[lang]
}

export { projectTitle, projectTitles } from './project-title'

export { cvPdfs } from './cv'

export function withTagsIn(meta: PostMeta, lang: Locale): PostMeta {
  return { ...meta, tags: tagsIn(meta.tags, lang) }
}

export async function loadPost(id: string, lang: Locale): Promise<LoadedPost | null> {
  const entry = Object.prototype.hasOwnProperty.call(postRegistry, id) ? postRegistry[id] : undefined
  if (!entry) return null
  const own = entry[lang]
  if (own) {
    const mod = await own()
    return { Content: mod.default, meta: withTagsIn(mod.meta, lang), fallback: false }
  }
  const other = entry[otherLocale(lang)]
  if (!other) return null
  const mod = await other()
  return { Content: mod.default, meta: withTagsIn(mod.meta, lang), fallback: true }
}

export async function listPosts(lang: Locale): Promise<ListedPost[]> {
  const loaded = await Promise.all(postIds().map((id) => loadPost(id, lang)))
  return loaded
    .filter((post): post is LoadedPost => post !== null)
    .map((post) => ({ ...post.meta, fallback: post.fallback }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
