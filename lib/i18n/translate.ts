export type Dictionary = Readonly<Record<string, string>>

export class MissingTranslationError extends Error {
  constructor(key: string) {
    super(`[i18n] Falta la clave "${key}" en español y en inglés`)
    this.name = 'MissingTranslationError'
  }
}

export function t(dict: Dictionary, key: string, vars?: Record<string, string | number>): string {
  const template = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : undefined
  if (typeof template !== 'string') throw new MissingTranslationError(key)
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

export function pickKeys(dict: Dictionary, keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, t(dict, key)]))
}
