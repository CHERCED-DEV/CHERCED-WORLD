import { createAssistant, pickAssistantTemplates, type Assistant, type AssistantTemplates } from '@/lib/assistant'
import { defaultLocale, type Locale } from '@/lib/i18n/config'
import { loadSearchIndex } from '@/lib/search/client'

type Json = { default: Record<string, string> }

const dictionaries: Record<Locale, () => Promise<Json>> = {
  es: () => import('@/content/i18n/es/experience.json'),
  en: () => import('@/content/i18n/en/experience.json'),
}

const assistants = new Map<Locale, Promise<Assistant>>()

async function loadTemplates(lang: Locale): Promise<AssistantTemplates> {
  const base = (await dictionaries[defaultLocale]()).default
  const own = lang === defaultLocale ? base : (await dictionaries[lang]()).default
  return pickAssistantTemplates({ ...base, ...own })
}

export function getAssistant(lang: Locale): Promise<Assistant> {
  const cached = assistants.get(lang)
  if (cached) return cached
  const pending = Promise.all([loadSearchIndex(lang), loadTemplates(lang)])
    .then(([index, templates]) => createAssistant(index, templates))
    .catch((error: unknown) => {
      assistants.delete(lang)
      throw error
    })
  assistants.set(lang, pending)
  return pending
}
