import type { ProjectEra, SocialId } from '@/content/types'
import type { Locale } from '@/lib/i18n/config'

export const SEARCH_INDEX_VERSION = 2

export const PAGE_IDS = ['home', 'about', 'services', 'portfolio', 'blog', 'contact', 'now', 'privacy'] as const

export type PageId = (typeof PAGE_IDS)[number]

export type SearchDocKind = 'page' | 'project' | 'post' | 'section' | 'skill'

export type SearchDoc = {
  id: string
  kind: SearchDocKind
  title: string
  text: string
  keywords: string
  url: string
}

export type PageFact = { title: string; url: string }

export type AdrFact = { decision: string; why: string; tradeoff: string }

export type RepoFact = { label: string; href: string }

export type ProjectFact = {
  id: string
  title: string
  era: ProjectEra
  summary: string
  context: string
  role: string | null
  decisions: string | null
  adrs: AdrFact[]
  result: string | null
  technologies: string[]
  url: string
  live: string | null
  github: string | null
  repos: RepoFact[]
}

export type PostFact = { id: string; title: string; description: string; date: string; tags: string[]; url: string }

export type SkillFact = { id: string; name: string; label: string; progress: number; used: string | null }

export type LobeFact = { id: string; name: string; words: string | null; skills: string[]; projects: string[]; url: string }

export type LanguageFact = { id: Locale; name: string; progress: number; level: string | null }

export type CvPdfFact = { lang: Locale; href: string; label: string; bytes: number }

export type AssistantFacts = {
  author: string
  pages: Record<PageId, PageFact>
  about: string
  skills: { tech: SkillFact[]; lobes: LobeFact[] }
  technologies: string[]
  career: { company: string; role: string; start: string; end: string | null; description: string }[]
  education: { institution: string; degree: string; start: string; end: string | null }[]
  courses: { name: string; description: string }[]
  platzi: { href: string; label: string }
  languages: LanguageFact[]
  services: { intro: string; items: { id: string; title: string; description: string }[] }
  portfolioIntro: string[]
  projects: ProjectFact[]
  posts: PostFact[]
  blogWelcome: string
  contact: { description: string; email: string | null }
  cv: { href: string; label: string; pdfs: CvPdfFact[] } | null
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
