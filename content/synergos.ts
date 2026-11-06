import type { Locale, SynergosFacts } from './types'

export const synergosFacts = {
  countedAt: '2026-11-01',
  pieces: 31,
  capabilities: 20,
  orchestrators: 9,
  measuredAt: '2026-11-05',
  testsAtLeast: 6600,
  adrsAtLeast: 140,
  designSystemAtLeast: 130,
} as const satisfies SynergosFacts

export function formatFact(value: number, lang: Locale): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'en-US', { useGrouping: 'always' }).format(value)
}

export function formatFloor(value: number, lang: Locale): string {
  return `${formatFact(value, lang)}+`
}
