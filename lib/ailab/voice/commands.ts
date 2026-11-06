import { voiceCommands, type VoiceCommand } from '@/content/ailab/voice-commands'
import { locales, type Locale } from '@/lib/i18n/config'
import { fold } from '@/lib/search/text'

export const MATCH_THRESHOLD = 0.78

const FILLERS = new Set(['por', 'favor', 'porfa', 'oye', 'hey', 'ok', 'okay', 'vale', 'bueno', 'please', 'hola', 'hi', 'eh', 'em', 'um', 'uh', 'ya', 'now'])

const EDGE_FILLERS = ['por favor', 'porfa', 'oye', 'hey', 'ok', 'okay', 'vale', 'bueno', 'please', 'hola', 'hi', 'eh', 'em', 'um', 'uh']

export type VoiceMatch = { command: VoiceCommand; phrase: string; lang: Locale; score: number }

export function normalizeUtterance(text: string): string {
  let value = fold(text.replace(/\b(\p{L})\.(?=\p{L}\b)/gu, '$1'))
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  let changed = true
  while (changed && value) {
    changed = false
    for (const filler of EDGE_FILLERS) {
      if (value === filler) return ''
      if (value.startsWith(`${filler} `)) {
        value = value.slice(filler.length + 1)
        changed = true
      }
      if (value.endsWith(` ${filler}`)) {
        value = value.slice(0, -(filler.length + 1))
        changed = true
      }
    }
  }
  return value
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a) return b.length
  if (!b) return a.length
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i]
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min((previous[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (previous[j - 1] ?? 0) + cost)
    }
    previous = row
  }
  return previous[b.length] ?? 0
}

function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length)
  return longest === 0 ? 1 : 1 - levenshtein(a, b) / longest
}

export function phraseScore(utterance: string, phrase: string): number {
  const u = normalizeUtterance(utterance)
  const p = normalizeUtterance(phrase)
  if (!u || !p) return 0
  if (u === p) return 1
  if (` ${u} `.includes(` ${p} `)) return 0.9 + 0.08 * (p.length / u.length)
  let best = similarity(u, p)
  const words = u.split(' ').filter((word) => !FILLERS.has(word))
  const size = p.split(' ').length
  for (const span of [size - 1, size, size + 1]) {
    if (span < 1 || span > words.length) continue
    for (let start = 0; start + span <= words.length; start += 1) {
      best = Math.max(best, similarity(words.slice(start, start + span).join(' '), p) * 0.95)
    }
  }
  return best
}

export function matchVoiceCommand(
  utterance: string,
  commands: readonly VoiceCommand[] = voiceCommands,
  threshold = MATCH_THRESHOLD,
): VoiceMatch | null {
  let best: VoiceMatch | null = null
  for (const command of commands) {
    for (const lang of locales) {
      for (const phrase of command.phrases[lang]) {
        const score = phraseScore(utterance, phrase)
        if (score >= threshold && (!best || score > best.score)) best = { command, phrase, lang, score }
      }
    }
  }
  return best
}
