import type { Locale, Localized } from '@/content/types'

export function projectTitle(project: { title: string | Localized }, lang: Locale): string {
  return typeof project.title === 'string' ? project.title : project.title[lang]
}

export function projectTitles(project: { title: string | Localized }): string[] {
  return typeof project.title === 'string' ? [project.title] : [...new Set([project.title.es, project.title.en])]
}
