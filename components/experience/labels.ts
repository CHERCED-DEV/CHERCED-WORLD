import { t, type Dictionary } from '@/lib/i18n/translate'

const UI_PREFIXES = ['palette.', 'assistant.', 'capsule.', 'shortcuts.']
const ENGINE_PREFIXES = ['assistant.tpl.', 'assistant.link.']
const ENGINE_KEYS = new Set(['assistant.unknown', 'assistant.outOfScope'])
const COMMON_KEYS = ['dialog.close', 'palette.hint', 'nav.now']

export type ExperienceLabels = Record<string, string>

export function uiLabels(experience: Dictionary, common: Dictionary): ExperienceLabels {
  const picked = Object.entries(experience).filter(
    ([key]) =>
      UI_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
      !ENGINE_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
      !ENGINE_KEYS.has(key),
  )
  return { ...Object.fromEntries(picked), ...Object.fromEntries(COMMON_KEYS.map((key) => [key, t(common, key)])) }
}
