import type { GeminiTtsVoice } from '@/lib/ai/models'
import type { Locale } from '@/lib/i18n/config'

export const LISTEN_ENDPOINT = '/api/listen'

export const LISTEN_TEXT_MAX = 260

export const LISTEN_VOICES = ['Charon', 'Kore'] as const satisfies readonly GeminiTtsVoice[]

export type ListenVoice = (typeof LISTEN_VOICES)[number]

export const DEFAULT_LISTEN_VOICE: ListenVoice = 'Charon'

export const LISTEN_VOICE_LABELS: Readonly<Record<Locale, Record<ListenVoice, string>>> = {
  es: { Charon: 'Charon · grave', Kore: 'Kore · clara' },
  en: { Charon: 'Charon · deep', Kore: 'Kore · bright' },
}

const SOURCE = /^(?:post:[a-z0-9][a-z0-9-]{0,99}|pitch:[a-z0-9][a-z0-9-]{0,59}|v3)$/

export function isListenVoice(value: unknown): value is ListenVoice {
  return typeof value === 'string' && (LISTEN_VOICES as readonly string[]).includes(value)
}

export function isListenSource(value: unknown): value is string {
  return typeof value === 'string' && SOURCE.test(value)
}

export type ListenRequest = { source: string; lang: Locale; voice: ListenVoice; text: string }

export function listenUrl({ source, lang, voice, text }: ListenRequest): string {
  return `${LISTEN_ENDPOINT}?${new URLSearchParams({ s: source, l: lang, v: voice, t: text })}`
}

export function matchKey(text: string): string {
  return text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

export function cleanSource(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\]\([^)]*\)/g, '] ')
    .replace(/<[^>]*>/g, ' ')
}

function withoutDigits(text: string): string {
  return text.replace(/\p{N}+/gu, '')
}

export function inCorpus(corpus: string, text: string): boolean {
  const needle = matchKey(text)
  if (needle.length < 2) return false
  const haystack = matchKey(cleanSource(corpus))
  if (haystack.includes(needle)) return true
  const bare = withoutDigits(needle)
  return bare.length >= 2 && withoutDigits(haystack).includes(bare)
}
