import en from '@/content/i18n/en/ailab.json'
import es from '@/content/i18n/es/ailab.json'
import type { Locale } from '@/lib/i18n/config'
import type { OgInput } from '@/lib/og/template'

const COPY = { es, en } as const

export function aiLabOg(lang: Locale): OgInput {
  return { lang, title: COPY[lang]['ailab.title'], line: COPY[lang]['ailab.meta.description'] }
}
