import type { Localized, Project, SiteContent } from '@/content/types'
import { localizedPath, type Locale } from '@/lib/i18n'
import { paragraphs } from '../format'
import type { SlideProject } from './carousel'
import type { AdrCardView } from '@/components/ui/AdrCards'

export function portfolioIntro(portfolio: SiteContent['portfolio'], lang: Locale): string | null {
  const text = portfolio.intro
    .map((paragraph) => paragraph[lang].trim())
    .filter((part) => part.length > 0)
    .join(' ')
  return text.length > 0 ? text : null
}

export function toSlide(project: Project, lang: Locale): SlideProject {
  return {
    id: project.id,
    order: project.order,
    title: project.title,
    summary: project.summary[lang],
    technologies: project.technologies,
    era: project.era,
    href: localizedPath(lang, `/portfolio/${project.id}`),
    image: {
      src: project.image.src,
      alt: project.image.alt[lang],
      width: project.image.width,
      height: project.image.height,
    },
  }
}

export type CaseStudyLabels = {
  context: string
  role: string
  decisions: string
  result: string
  technologies: string
  links: string
  live: string
  github: string
  newTab: string
}

export type CaseStudySection = { id: 'context' | 'role' | 'decisions' | 'result'; heading: string; paragraphs: string[] }

export function caseStudySections(project: Project, lang: Locale, labels: CaseStudyLabels): CaseStudySection[] {
  const fields: Array<[CaseStudySection['id'], Localized | null]> = [
    ['context', project.context],
    ['role', project.role],
    ['decisions', project.decisions],
    ['result', project.result],
  ]
  return fields.flatMap(([id, value]) => {
    const parts = value ? paragraphs(value[lang] ?? '') : []
    return parts.length > 0 ? [{ id, heading: labels[id], paragraphs: parts }] : []
  })
}

export type CaseNeighbor = { id: string; title: string; href: string }

export type CaseNeighbors = { prev: CaseNeighbor; next: CaseNeighbor; position: number; total: number }

export function caseStudyNeighbors(list: readonly Project[], id: string, lang: Locale): CaseNeighbors | null {
  const ordered = [...list].sort((a, b) => a.order - b.order)
  const index = ordered.findIndex((project) => project.id === id)
  if (index < 0 || ordered.length < 2) return null
  const at = (offset: number): CaseNeighbor => {
    const project = ordered[(index + offset + ordered.length) % ordered.length]!
    return { id: project.id, title: project.title, href: localizedPath(lang, `/portfolio/${project.id}`) }
  }
  return { prev: at(-1), next: at(1), position: index + 1, total: ordered.length }
}

export function technologyCounts(list: readonly Project[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const project of list) for (const tech of new Set(project.technologies)) counts[tech] = (counts[tech] ?? 0) + 1
  return counts
}

export function galleryImages(project: Project, lang: Locale): Array<{ src: string; alt: string; width: number; height: number }> {
  const extra = project.gallery ?? []
  return [project.image, ...extra.filter((image) => image.src !== project.image.src)].map((image) => ({
    src: image.src,
    alt: image.alt[lang],
    width: image.width,
    height: image.height,
  }))
}

export function caseHighlights(project: Project, lang: Locale): string[] {
  const list = project.highlights ?? []
  return list.map((item) => item[lang].trim()).filter((text) => text.length > 0)
}

export function caseStudyLinks(project: Project, labels: CaseStudyLabels): Array<{ id: 'live' | 'github'; href: string; label: string }> {
  const links: Array<{ id: 'live' | 'github'; href: string | null; label: string }> = [
    { id: 'live', href: project.links.live, label: labels.live },
    { id: 'github', href: project.links.github, label: labels.github },
  ]
  return links.flatMap((link) => (link.href ? [{ id: link.id, href: link.href, label: link.label }] : []))
}

export function caseStudyRepos(project: Project): Array<{ label: string; href: string }> {
  const seen = new Set<string>()
  return (project.links.repos ?? []).flatMap((repo) => {
    const label = repo.label.trim()
    const href = repo.href.trim()
    if (!label || !/^https:\/\//.test(href) || seen.has(href)) return []
    seen.add(href)
    return [{ label, href }]
  })
}

export type { AdrCardView }

export function caseAdrCards(project: Project, lang: Locale): AdrCardView[] {
  return (project.adrCards ?? []).flatMap((card) => {
    const view = { decision: card.decision[lang].trim(), why: card.why[lang].trim(), tradeoff: card.tradeoff[lang].trim() }
    return view.decision && view.why && view.tradeoff ? [view] : []
  })
}

export type DiagramLayerView = { id: string; label: string; role: string }

export const DIAGRAM_MIN_LAYERS = 2

export function caseDiagram(project: Project, lang: Locale): DiagramLayerView[] {
  const layers = (project.diagram ?? []).flatMap((layer) => {
    const view = { id: layer.id, label: layer.label[lang].trim(), role: layer.role[lang].trim() }
    return view.id && view.label && view.role ? [view] : []
  })
  return layers.length >= DIAGRAM_MIN_LAYERS ? layers : []
}

export type StorySection = CaseStudySection & { cards: boolean }

export function caseStorySections(project: Project, lang: Locale, labels: CaseStudyLabels, withCards: boolean): StorySection[] {
  const sections = caseStudySections(project, lang, labels).map((section) => ({ ...section, cards: false }))
  if (!withCards) return sections
  const decisions = sections.find((section) => section.id === 'decisions')
  if (decisions) {
    decisions.cards = true
    decisions.paragraphs = []
    return sections
  }
  const card: StorySection = { id: 'decisions', heading: labels.decisions, paragraphs: [], cards: true }
  const after = sections.findIndex((section) => section.id === 'result')
  return after < 0 ? [...sections, card] : [...sections.slice(0, after), card, ...sections.slice(after)]
}
