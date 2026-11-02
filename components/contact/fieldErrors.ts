import { t, type Dictionary } from '@/lib/i18n'
import { ERROR_KEYS, LIMITS } from '@/lib/validation'

export const FALLBACK_ERROR = '_fallback'

export const PHONE_INPUT_PATTERN = String.raw`\+?[0-9 \(\)\-]{6,20}`

const MAX_BY_FIELD: Record<string, number> = {
  name: LIMITS.name,
  userName: LIMITS.name,
  email: LIMITS.email,
  message: LIMITS.message,
  comment: LIMITS.comment,
  text: LIMITS.reply,
  password: LIMITS.passwordMax,
  current: LIMITS.passwordMax,
  confirm: LIMITS.passwordMax,
}

export const FORM_ERROR_KEYS: readonly string[] = Object.values(ERROR_KEYS)

export function fieldErrorText(messages: Dictionary, key: string | undefined, field: string): string | undefined {
  if (!key) return undefined
  const known = Object.prototype.hasOwnProperty.call(messages, key) ? key : FALLBACK_ERROR
  if (!Object.prototype.hasOwnProperty.call(messages, known)) return undefined
  return t(messages, known, { max: MAX_BY_FIELD[field] ?? LIMITS.message, min: LIMITS.passwordMin })
}

export function focusFirstInvalid(form: HTMLFormElement, errors: Record<string, string>): void {
  for (const element of Array.from(form.elements)) {
    const name = (element as HTMLInputElement).name
    if (name && errors[name] && typeof (element as HTMLElement).focus === 'function') {
      ;(element as HTMLElement).focus()
      return
    }
  }
}
