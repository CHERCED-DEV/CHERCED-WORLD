import { t, type Dictionary } from '@/lib/i18n/translate'

const UI_PREFIXES = ['palette.', 'assistant.', 'capsule.']
const ENGINE_PREFIXES = ['assistant.tpl.', 'assistant.link.']
const ENGINE_KEYS = new Set(['assistant.unknown', 'assistant.outOfScope'])

export type ExperienceLabels = Record<string, string>

export function uiLabels(experience: Dictionary, common: Dictionary): ExperienceLabels {
  const picked = Object.entries(experience).filter(
    ([key]) =>
      UI_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
      !ENGINE_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
      !ENGINE_KEYS.has(key),
  )
  return { ...Object.fromEntries(picked), 'dialog.close': t(common, 'dialog.close') }
}
