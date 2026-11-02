import { createAssistant, detectLanguage, pickAssistantTemplates, type Assistant, type AssistantAnswer } from '@/lib/assistant'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/server'
import { buildSearchIndex } from '@/lib/search/build-index'

export type Assistants = Record<Locale, Assistant>

export async function loadAssistants(): Promise<Assistants> {
  const build = async (lang: Locale) =>
    createAssistant(await buildSearchIndex(lang), pickAssistantTemplates(await getDictionary(lang, 'experience')))
  const [es, en] = await Promise.all([build('es'), build('en')])
  return { es, en }
}

export function ask(assistants: Assistants, question: string, fallback: Locale = 'es'): AssistantAnswer {
  return assistants[detectLanguage(question, fallback)].answer(question)
}
