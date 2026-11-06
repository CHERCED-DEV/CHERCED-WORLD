import { projects } from '@/content/projects'
import { synergosShowcase, SYNERGOS_CASE_ID } from '@/content/synergos-showcase'
import { projectTitle } from '@/lib/content/project-title'
import type { Locale } from '@/lib/i18n/config'
import type { OgInput } from '@/lib/og/template'

export function synergosOg(lang: Locale): OgInput {
  const project = projects.find((item) => item.id === SYNERGOS_CASE_ID)
  return {
    lang,
    title: project ? projectTitle(project, lang) : synergosShowcase.copy.title[lang],
    line: project?.summary[lang] ?? synergosShowcase.copy.description[lang],
  }
}
