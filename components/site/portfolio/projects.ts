import type { Localized, Project } from '@/content/types'
import { localizedPath, type Locale } from '@/lib/i18n'
import type { SlideProject } from './carousel'

export function toSlide(project: Project, lang: Locale): SlideProject {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary[lang],
    technologies: project.technologies,
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

export type CaseStudySection = { id: 'context' | 'role' | 'decisions' | 'result'; heading: string; text: string }

export function caseStudySections(project: Project, lang: Locale, labels: CaseStudyLabels): CaseStudySection[] {
  const fields: Array<[CaseStudySection['id'], Localized | null]> = [
    ['context', project.context],
    ['role', project.role],
    ['decisions', project.decisions],
    ['result', project.result],
  ]
  return fields.flatMap(([id, value]) => {
    const text = value?.[lang]?.trim()
    return text ? [{ id, heading: labels[id], text }] : []
  })
}

export function caseStudyLinks(project: Project, labels: CaseStudyLabels): Array<{ id: 'live' | 'github'; href: string; label: string }> {
  const links: Array<{ id: 'live' | 'github'; href: string | null; label: string }> = [
    { id: 'live', href: project.links.live, label: labels.live },
    { id: 'github', href: project.links.github, label: labels.github },
  ]
  return links.flatMap((link) => (link.href ? [{ id: link.id, href: link.href, label: link.label }] : []))
}
