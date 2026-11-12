import type { Localized } from '@/content/types'
import { activeHeading, spyLine } from '@/lib/blog/progress'
import type { ScrollDirection } from '@/lib/fx/viewport'
import type { Locale } from '@/lib/i18n'

export type NavSection = { id: string; label: string }

export type SectionEntry = { id: string; label: Localized | string }

export function localizeSections(entries: readonly SectionEntry[], lang: Locale): NavSection[] {
  return entries.map((entry) => ({ id: entry.id, label: typeof entry.label === 'string' ? entry.label : entry.label[lang] }))
}

export const SECTION_TAB_QUERY = '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)'

export const SECTION_TAB_RELEASE = 48

export const SECTION_LIMIT = 12

export const SECTION_TIMELINE = '--cw-section'

const SAFE_ID = /^[A-Za-z][\w-]*$/

export type SectionTabState = 'open' | 'compact'

export function sectionTabState({
  compactable,
  direction,
  pinned,
  focused,
}: {
  compactable: boolean
  direction: ScrollDirection
  pinned: boolean
  focused: boolean
}): SectionTabState {
  return compactable && direction === 'down' && !pinned && !focused ? 'compact' : 'open'
}

export type SectionTabMetrics = {
  track: number
  start: number
  end: number
  badge: number
  scroll: number
  width: number
  lefts: number[]
}

export function sectionTabGeometry({ track, start, end, badge, scroll, width, lefts }: SectionTabMetrics): { shift: number; pulls: number[] } {
  const shift = Math.max(0, Math.round(track - (start + badge + width + end)))
  return { shift, pulls: lefts.map((left) => Math.round(shift + start + badge - left + scroll)) }
}

export function sectionNumber(index: number): string {
  return String(index + 1).padStart(2, '0')
}

export function navSections(sections: readonly NavSection[]): NavSection[] {
  const seen = new Set<string>()
  return sections
    .filter((section) => {
      if (!SAFE_ID.test(section.id) || seen.has(section.id)) return false
      seen.add(section.id)
      return true
    })
    .slice(0, SECTION_LIMIT)
}

export function sectionTimelineCss(sections: readonly NavSection[]): string {
  const rules = sections
    .slice(0, SECTION_LIMIT)
    .map((section, index) => `#${section.id}{view-timeline:${SECTION_TIMELINE}-${index + 1} block;view-timeline-inset:auto}`)
    .join('')
  return rules ? `@supports (animation-timeline: view()) and (timeline-scope: none){@media (prefers-reduced-motion: no-preference){${rules}}}` : ''
}

export type SectionTop = { id: string; top: number }

export function activeSection(tops: readonly SectionTop[], { line, viewport, atEnd }: { line: number; viewport: number; atEnd: boolean }): string {
  return activeHeading(tops, atEnd ? viewport - 1 : line) ?? tops[0]?.id ?? ''
}

export function readingLine(viewport: number, header: number): number {
  return spyLine(viewport, header)
}
