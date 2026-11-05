import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import experienceEn from '@/content/i18n/en/experience.json'
import experienceEs from '@/content/i18n/es/experience.json'
import type { Locale } from '@/lib/i18n/config'
import { t, type Dictionary } from '@/lib/i18n/translate'

export type SharedNamespace = 'common' | 'experience'

const dictionaries: Record<SharedNamespace, Record<Locale, Dictionary>> = {
  common: { es: Object.freeze({ ...commonEs }), en: Object.freeze({ ...commonEs, ...commonEn }) },
  experience: { es: Object.freeze({ ...experienceEs }), en: Object.freeze({ ...experienceEs, ...experienceEn }) },
}

export function sharedText(lang: Locale, ns: SharedNamespace, key: string, vars?: Record<string, string | number>): string {
  return t(dictionaries[ns][lang], key, vars)
}
