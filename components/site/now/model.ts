import type { Locale, NowContent, NowEntry } from '@/content/types'

export const NOW_BLOCKS = ['building', 'learning', 'preparing', 'offKeyboard'] as const

export type NowBlockId = (typeof NOW_BLOCKS)[number]

export type NowLine = { lead: string | null; rest: string; lang?: 'la' }

export type NowBlock = { id: NowBlockId; lines: NowLine[] }

const LEAD = /^(.+?[:.])\s+(\S[\s\S]*)$/u

export function splitLead(text: string): { lead: string | null; rest: string } {
  const match = LEAD.exec(text.trim())
  if (!match) return { lead: null, rest: text.trim() }
  return { lead: match[1] ?? '', rest: match[2] ?? '' }
}

function line(entry: NowEntry, lang: Locale): NowLine {
  const { lead, rest } = splitLead(entry[lang])
  return entry.lang ? { lead, rest, lang: entry.lang } : { lead, rest }
}

export function nowBlocks(now: NowContent, lang: Locale): NowBlock[] {
  return NOW_BLOCKS.flatMap((id) => {
    const lines = now[id].map((entry) => line(entry, lang))
    return lines.length > 0 ? [{ id, lines }] : []
  })
}

export type NowMotto = { text: string; lang?: 'la' }

export function nowMottos(now: NowContent, lang: Locale): NowMotto[] {
  return now.mottos.map((entry) => (entry.lang ? { text: entry[lang], lang: entry.lang } : { text: entry[lang] }))
}

export function formatNowDate(value: string, lang: Locale): string {
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}
