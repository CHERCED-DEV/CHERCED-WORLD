import { localizedPath, type Locale } from '@/lib/i18n'
import { slugify } from './slug'

export type Taggable = { tags: readonly string[] }

export type BlogTag = { slug: string; label: string; count: number }

export function tagSlug(tag: string): string {
  return slugify(tag)
}

export function tagPath(lang: Locale, tag: string): string {
  return localizedPath(lang, `/blog/tag/${encodeURIComponent(tagSlug(tag))}`)
}

export function uniqueTagSlugs(posts: Iterable<Taggable>): string[] {
  const slugs = new Set<string>()
  for (const post of posts) for (const tag of post.tags) slugs.add(tagSlug(tag))
  return [...slugs].sort()
}

export function postTags(posts: readonly Taggable[]): BlogTag[] {
  const found = new Map<string, BlogTag>()
  for (const post of posts) {
    for (const slug of new Set(post.tags.map(tagSlug))) {
      const label = post.tags.find((tag) => tagSlug(tag) === slug) ?? slug
      const current = found.get(slug)
      found.set(slug, current ? { ...current, count: current.count + 1 } : { slug, label, count: 1 })
    }
  }
  return [...found.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function hasTag(post: Taggable, tag: string): boolean {
  const slug = tagSlug(tag)
  return post.tags.some((own) => tagSlug(own) === slug)
}

export function postsWithTag<T extends Taggable>(posts: readonly T[], tag: string): T[] {
  return posts.filter((post) => hasTag(post, tag))
}
