import { CASE_POSTS } from '@/content/related'
import type { Project, ServiceId, ServiceItem } from '@/content/types'
import { postPath } from '@/lib/blog/paths'
import { projectTitle } from '@/lib/content/project-title'
import { localizedPath, type Locale } from '@/lib/i18n'
import { SERVICE_CASES } from '../services/model'

export type CaseRelatedKind = 'post' | 'services'

export type CaseRelatedLink = { kind: CaseRelatedKind; id: string; href: string; host: string; name: string; lang?: Locale }

export type RelatedPostTitle = { id: string; title: string; lang: Locale }

export type CaseRelatedLabels = { post: string; services: string }

type CasePostMap = Readonly<Record<string, readonly string[]>>

type ServiceCaseMap = Readonly<Partial<Record<ServiceId, readonly string[]>>>

export function casePostIds(projectId: string, map: CasePostMap = CASE_POSTS): string[] {
  return [...(map[projectId] ?? [])]
}

export function postCaseIds(postId: string, map: CasePostMap = CASE_POSTS): string[] {
  return Object.entries(map).flatMap(([caseId, posts]) => (posts.includes(postId) ? [caseId] : []))
}

export function caseServiceIds(projectId: string, order: readonly ServiceId[], map: ServiceCaseMap = SERVICE_CASES): ServiceId[] {
  return order.filter((service) => (map[service] ?? []).includes(projectId))
}

export function caseRelatedLinks(input: {
  projectId: string
  lang: Locale
  posts: readonly RelatedPostTitle[]
  services: readonly ServiceItem[]
  labels: CaseRelatedLabels
  map?: ServiceCaseMap
}): CaseRelatedLink[] {
  const { projectId, lang, posts, services, labels, map = SERVICE_CASES } = input
  const postLinks = posts.map((post) => ({
    kind: 'post' as const,
    id: post.id,
    href: postPath(lang, post.id),
    host: labels.post,
    name: post.title,
    ...(post.lang !== lang ? { lang: post.lang } : {}),
  }))
  const related = caseServiceIds(
    projectId,
    services.map((item) => item.id),
    map,
  )
  const titles = services.filter((item) => related.includes(item.id)).map((item) => item.title[lang])
  const serviceLink =
    titles.length > 0 ? [{ kind: 'services' as const, id: related.join(' '), href: localizedPath(lang, '/services'), host: labels.services, name: titles.join(' · ') }] : []
  return [...postLinks, ...serviceLink]
}

export type RelatedCase = { id: string; title: string; summary: string; href: string }

export function relatedCases(postId: string, projects: readonly Project[], lang: Locale, map: CasePostMap = CASE_POSTS): RelatedCase[] {
  const ids = postCaseIds(postId, map)
  return projects
    .filter((project) => ids.includes(project.id))
    .map((project) => ({
      id: project.id,
      title: projectTitle(project, lang),
      summary: project.summary[lang],
      href: localizedPath(lang, `/portfolio/${project.id}`),
    }))
}
