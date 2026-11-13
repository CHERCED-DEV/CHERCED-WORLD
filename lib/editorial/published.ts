import { z } from 'zod'
import type { Locale, PostMeta } from '@/content/types'
import { findTag } from '@/lib/blog/tags'
import { PUBLISHED_PREFIX, PUBLISHED_SLUG_MAX } from './published-id'

export { isPublishedId, PUBLISHED_ID_PATTERN, PUBLISHED_PREFIX, PUBLISHED_SLUG_MAX } from './published-id'

export const PUBLISHED_FALLBACK_SLUG = 'articulo'

export function publishedSlug(title: string): string {
  const ascii = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const cut = ascii.slice(0, PUBLISHED_SLUG_MAX).replace(/-+$/g, '')
  return cut || PUBLISHED_FALLBACK_SLUG
}

export function publishedId(title: string, taken: ReadonlySet<string>): string {
  const base = publishedSlug(title)
  for (let n = 1; ; n++) {
    const suffix = n === 1 ? '' : `-${n}`
    const id = `${PUBLISHED_PREFIX}${base.slice(0, PUBLISHED_SLUG_MAX - suffix.length).replace(/-+$/g, '')}${suffix}`
    if (!taken.has(id)) return id
  }
}

export type PublishedPost = {
  id: string
  draftId: string
  lang: Locale
  title: string
  description: string
  tags: string[]
  body: string
  date: string
  updated?: string
  publishedAt: string
  updatedAt: string
}

export const publishInput = z.object({ id: z.string().uuid(), version: z.number().int().min(1) })

export const unpublishInput = z.object({ id: z.string().uuid() })

export type PublishedSummary = { id: string; draftId: string; lang: Locale; date: string; updated?: string }

export type PublishResult =
  | { ok: true; post: PublishedSummary; dropped: string[] }
  | { ok: false; error: 'unauthorized' | 'validation' | 'conflict' | 'incomplete' | 'unavailable' }

export type UnpublishResult = { ok: true } | { ok: false; error: 'unauthorized' | 'validation' | 'unavailable' }

export type CatalogTags = { kept: string[]; dropped: string[] }

export function catalogTags(tags: readonly string[], lang: Locale): CatalogTags {
  const kept: string[] = []
  const dropped: string[] = []
  for (const tag of tags) {
    const names = findTag(tag)
    if (!names) dropped.push(tag)
    else if (!kept.includes(names[lang])) kept.push(names[lang])
  }
  return { kept, dropped }
}

export function isPublishable(draft: { title: string; description: string; body: string }): boolean {
  return draft.title.trim().length > 0 && draft.description.trim().length > 0 && draft.body.trim().length > 0
}

export function publishedImagePath(lang: Locale, id: string): string {
  return `/${lang}/blog/${id}/opengraph-image/og`
}

export function publishedMeta(post: PublishedPost): PostMeta {
  return {
    id: post.id,
    lang: post.lang,
    originalLang: post.lang,
    title: post.title,
    description: post.description,
    date: post.date,
    ...(post.updated ? { updated: post.updated } : {}),
    tags: [...post.tags],
    image: { src: publishedImagePath(post.lang, post.id), alt: post.title, width: 1200, height: 630 },
    author: 'Camilo Hernández',
    cover: 'generated',
  }
}

export function summaryOf(post: PublishedPost): PublishedSummary {
  return { id: post.id, draftId: post.draftId, lang: post.lang, date: post.date, ...(post.updated ? { updated: post.updated } : {}) }
}
