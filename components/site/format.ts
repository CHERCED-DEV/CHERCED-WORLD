import type { Locale, SocialId, SocialLink } from '@/content/types'

const MONTH = /^(\d{4})-(\d{2})$/
const YEAR = /^\d{4}$/

export function formatMonth(value: string, lang: Locale): string {
  if (YEAR.test(value)) return value
  const match = MONTH.exec(value)
  if (!match) return value
  const year = Number(match[1])
  const month = Number(match[2])
  const name = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(/\.$/, '')
  return `${name} ${year}`
}

export function formatPeriod(start: string, end: string | null, lang: Locale, presentLabel: string): string {
  return `${formatMonth(start, lang)} – ${end === null ? presentLabel : formatMonth(end, lang)}`
}

export type PeriodBound = { dateTime: string; label: string }

export type PeriodParts = { start: PeriodBound; end: PeriodBound | null; current: boolean }

export function periodParts(start: string, end: string | null, lang: Locale): PeriodParts {
  return {
    start: { dateTime: start, label: formatMonth(start, lang) },
    end: end === null ? null : { dateTime: end, label: formatMonth(end, lang) },
    current: end === null,
  }
}

export function isPublishable(entries: ReadonlyArray<{ pending?: true }>): boolean {
  return entries.length > 0 && entries.every((entry) => entry.pending !== true)
}

export const HOME_SOCIALS: readonly SocialId[] = ['email', 'github', 'linkedin']

export type PublishedSocial = SocialLink & { href: string }

export function homeSocials(socials: readonly SocialLink[]): PublishedSocial[] {
  return HOME_SOCIALS.flatMap((id) => {
    const social = socials.find((item) => item.id === id)
    return social && social.href !== null ? [{ ...social, href: social.href }] : []
  })
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

export function splitLead(text: string): { lead: string | null; body: string } {
  const match = /^(\s*[¿]?[^?.!¡¿]{1,80}\?)\s+(\S[\s\S]*)$/.exec(text)
  if (!match) return { lead: null, body: text }
  return { lead: (match[1] ?? '').trim(), body: match[2] ?? '' }
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
}

export function clampLevel(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}
