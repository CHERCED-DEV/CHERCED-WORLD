import en from '@/content/i18n/en/fun.json'
import es from '@/content/i18n/es/fun.json'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/translate'

export function funDictionary(lang: Locale): Dictionary {
  return Object.freeze(lang === 'es' ? { ...es } : { ...es, ...en })
}
