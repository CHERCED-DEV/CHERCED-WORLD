import type { SocialId } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export const SEARCH_INDEX_VERSION = 1

export const PAGE_IDS = ['home', 'about', 'services', 'portfolio', 'blog', 'contact', 'privacy'] as const

export type PageId = (typeof PAGE_IDS)[number]

export type SearchDocKind = 'page' | 'project' | 'post' | 'section'

export type SearchDoc = {
  id: string
  kind: SearchDocKind
  title: string
  text: string
  keywords: string
  url: string
}

export type PageFact = { title: string; url: string }

export type ProjectFact = {
  id: string
  title: string
  summary: string
  details: string[]
  technologies: string[]
  url: string
  live: string | null
  github: string | null
}

export type PostFact = { id: string; title: string; description: string; date: string; tags: string[]; url: string }

export type AssistantFacts = {
  author: string
  pages: Record<PageId, PageFact>
  about: string
  skills: { intro: string; bullets: string[]; tech: { name: string; progress: number }[] }
  technologies: string[]
  career: { company: string; role: string; start: string; end: string | null; description: string }[]
  education: { institution: string; degree: string; start: string; end: string | null }[]
  courses: { name: string; description: string }[]
  platzi: { href: string; label: string }
  languages: { name: string; progress: number }[]
  services: { intro: string; items: { id: string; title: string; description: string }[] }
  portfolioIntro: string[]
  projects: ProjectFact[]
  posts: PostFact[]
  blogWelcome: string
  contact: { description: string; email: string | null }
  socials: { id: SocialId; label: string; href: string }[]
}

export type SearchIndex = {
  version: typeof SEARCH_INDEX_VERSION
  lang: Locale
  docs: SearchDoc[]
  facts: AssistantFacts
}

export function isSearchIndex(value: unknown): value is SearchIndex {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SearchIndex>
  return (
    candidate.version === SEARCH_INDEX_VERSION &&
    (candidate.lang === 'es' || candidate.lang === 'en') &&
    Array.isArray(candidate.docs) &&
    typeof candidate.facts === 'object' &&
    candidate.facts !== null
  )
}
