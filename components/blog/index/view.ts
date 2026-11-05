import 'server-only'
import { postCards } from '@/components/blog/posts'
import { feedPath } from '@/lib/blog/feed'
import { featuredPost, groupByYear, type YearLabel } from '@/lib/blog/groups'
import { blogPath } from '@/lib/blog/paths'
import { ownPosts } from '@/lib/blog/source'
import { postsWithTag, postTags, tagPath, tagSlug, type BlogTag } from '@/lib/blog/tags'
import { getSite, pick } from '@/lib/content'
import { alternates, locales, otherLocale, t, type Alternates, type Dictionary, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import type { PostCardLabels, PostCardPost } from '../PostCard'
import type { BlogSearchLabels } from './BlogSearch'
import { toSearchDocs, type BlogSearchDoc } from './search'
import { ALL_TAGS, type TagFilterItem } from './model'

export type BlogIntroView = { title: string; titleStrong: string; welcome: string }

export type BlogGroupView = { year: number; label: YearLabel; title: string; posts: PostCardPost[] }

export type BlogTagView = {
  slug: string
  label: string
  count: number
  summary: string
  clear: { href: string; label: string }
  index: { href: string; label: string }
}

export type BlogIndexView = {
  lang: Locale
  intro: BlogIntroView
  cardLabels: PostCardLabels
  featured: { post: PostCardPost; badge: string } | null
  groups: BlogGroupView[]
  toolbar: {
    filterLabel: string
    rss: { href: string; label: string }
    tags: TagFilterItem[]
    active: string
  }
  search: { docs: BlogSearchDoc[]; labels: BlogSearchLabels } | null
  tag: BlogTagView | null
}

export function tagResultsText(blog: Dictionary, count: number, tag: string): string {
  return t(blog, count === 1 ? 'index.tagResults.one' : 'index.tagResults', { count, tag })
}

export function groupTitle(blog: Dictionary, label: YearLabel): string {
  return t(blog, label === 'now' ? 'index.now' : 'index.archive')
}

export function filterItems(lang: Locale, blog: Dictionary, tags: readonly BlogTag[]): TagFilterItem[] {
  return [
    { key: ALL_TAGS, label: t(blog, 'index.allTags'), href: blogPath(lang) },
    ...tags.map((tag) => ({ key: tag.slug, label: tag.label, href: tagPath(lang, tag.slug) })),
  ]
}

export function cardLabels(blog: Dictionary): PostCardLabels {
  return {
    readMore: t(blog, 'post.readMore'),
    originalLanguage: t(blog, 'post.originalLanguage'),
    tags: t(blog, 'post.tags'),
  }
}

export function searchLabels(blog: Dictionary, experience: Dictionary): BlogSearchLabels {
  return {
    search: t(blog, 'index.search'),
    clear: t(blog, 'index.clear'),
    noResults: t(blog, 'index.noResults'),
    result: t(experience, 'palette.result'),
    results: t(experience, 'palette.results'),
  }
}

function introView(lang: Locale): BlogIntroView {
  const intro = getSite().blog
  return { title: pick(intro.title, lang), titleStrong: intro.titleStrong, welcome: pick(intro.welcome, lang) }
}

function groupViews(blog: Dictionary, posts: readonly PostCardPost[], exclude: readonly string[]): BlogGroupView[] {
  return groupByYear(posts, exclude).map((group) => ({ ...group, title: groupTitle(blog, group.label) }))
}

export type TagAlternates = { canonical: string; languages: Partial<Alternates['languages']> }

export function tagAlternates(lang: Locale, slug: string, langs: readonly Locale[]): TagAlternates {
  const page = alternates(tagPath(lang, slug))
  const listed = Object.entries(page.languages).filter(
    ([key]) => langs.length === locales.length || langs.includes(key as Locale),
  )
  return { canonical: page.canonical, languages: Object.fromEntries(listed) }
}

export async function tagLangs(slug: string): Promise<Locale[]> {
  const perLang = await Promise.all(locales.map(async (lang) => [lang, postsWithTag(await ownPosts(lang), slug).length] as const))
  return perLang.filter(([, count]) => count > 0).map(([lang]) => lang)
}

export async function tagLabel(lang: Locale, slug: string): Promise<string> {
  for (const source of [lang, otherLocale(lang)]) {
    const found = postTags(await ownPosts(source)).find((tag) => tag.slug === slug)
    if (found) return found.label
  }
  return slug
}

async function baseView(lang: Locale) {
  const [blog, experience] = await Promise.all([getDictionary(lang, 'blog'), getDictionary(lang, 'experience')])
  const [cards, own] = await Promise.all([postCards(lang, blog), ownPosts(lang)])
  return { blog, experience, cards, tags: postTags(own), own }
}

export async function blogIndexView(lang: Locale): Promise<BlogIndexView> {
  const { blog, experience, cards, tags } = await baseView(lang)
  const featured = featuredPost(cards)
  return {
    lang,
    intro: introView(lang),
    cardLabels: cardLabels(blog),
    featured: featured ? { post: featured, badge: t(blog, 'index.featured') } : null,
    groups: groupViews(blog, cards, featured ? [featured.id] : []),
    toolbar: {
      filterLabel: t(blog, 'index.filter'),
      rss: { href: feedPath(lang), label: t(blog, 'index.rss') },
      tags: filterItems(lang, blog, tags),
      active: ALL_TAGS,
    },
    search: { docs: toSearchDocs(cards), labels: searchLabels(blog, experience) },
    tag: null,
  }
}

export async function tagIndexView(lang: Locale, tag: string): Promise<BlogIndexView> {
  const slug = tagSlug(tag)
  const [{ blog, cards, tags, own }, label] = await Promise.all([baseView(lang), tagLabel(lang, slug)])
  const matching = new Set(postsWithTag(own, slug).map((post) => post.id))
  const exclude = cards.filter((card) => !matching.has(card.id)).map((card) => card.id)
  const count = matching.size
  return {
    lang,
    intro: introView(lang),
    cardLabels: cardLabels(blog),
    featured: null,
    groups: groupViews(blog, cards, exclude),
    toolbar: {
      filterLabel: t(blog, 'index.filter'),
      rss: { href: feedPath(lang), label: t(blog, 'index.rss') },
      tags: filterItems(lang, blog, tags),
      active: slug,
    },
    search: null,
    tag: {
      slug,
      label,
      count,
      summary: tagResultsText(blog, count, label),
      clear: { href: blogPath(lang), label: t(blog, 'index.clear') },
      index: { href: blogPath(lang), label: t(blog, 'nav.index') },
    },
  }
}
