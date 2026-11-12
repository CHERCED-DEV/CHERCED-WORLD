import { tags as catalog, type PostTagNames } from '@/content/posts/tags'
import { defaultLocale, locales, localizedPath, stripLocale, switchLocalePath, type Alternates, type Locale } from '@/lib/i18n'
import { slugify } from './slug'

export type Taggable = { tags: readonly string[] }

export type BlogTag = { slug: string; label: string; count: number }

export type TagAlternates = { canonical: string; languages: Partial<Alternates['languages']> }

export function tagSlug(tag: string): string {
  return slugify(tag)
}

const bySlug = new Map<string, PostTagNames>()
for (const names of catalog) {
  for (const lang of locales) if (!bySlug.has(tagSlug(names[lang]))) bySlug.set(tagSlug(names[lang]), names)
}

export function findTag(tag: string): PostTagNames | null {
  return bySlug.get(tagSlug(tag)) ?? null
}

export function tagIn(tag: string, lang: Locale): string {
  return findTag(tag)?.[lang] ?? tag
}

export function tagsIn(tags: readonly string[], lang: Locale): string[] {
  return tags.map((tag) => tagIn(tag, lang))
}

export function tagSlugIn(tag: string, lang: Locale): string {
  return tagSlug(tagIn(tag, lang))
}

export function tagKey(tag: string): string {
  return tagSlugIn(tag, defaultLocale)
}

export function tagPath(lang: Locale, tag: string): string {
  return localizedPath(lang, `/blog/tag/${encodeURIComponent(tagSlugIn(tag, lang))}`)
}

const TAG_PAGE = /^\/[a-z]{2}\/blog\/tag\/([^/?#]+)\/?$/

export function switchLocaleKeepingTag(pathname: string, to: Locale): string {
  const slug = TAG_PAGE.exec(pathname)?.[1]
  if (slug === undefined) return switchLocalePath(pathname, to)
  let tag = slug
  try {
    tag = decodeURIComponent(slug)
  } catch {}
  return findTag(tag) ? tagPath(to, tag) : switchLocalePath(pathname, to)
}

export function tagAlternates(lang: Locale, tag: string, langs: readonly Locale[]): TagAlternates {
  const listed = locales.filter((other) => langs.includes(other))
  const languages: TagAlternates['languages'] = Object.fromEntries(listed.map((other) => [other, tagPath(other, tag)]))
  if (listed.length === locales.length) languages['x-default'] = stripLocale(tagPath(defaultLocale, tag)).path
  return { canonical: tagPath(lang, tag), languages }
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
  const key = tagKey(tag)
  return post.tags.some((own) => tagKey(own) === key)
}

export function postsWithTag<T extends Taggable>(posts: readonly T[], tag: string): T[] {
  return posts.filter((post) => hasTag(post, tag))
}
