import type { ActionResult } from '@/lib/actions/result'
import { ERROR_KEYS } from '@/lib/validation'

export type CommentAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>

export type CommentFormStatus = 'idle' | 'success' | 'validation' | 'unavailable' | 'rate_limited' | 'error'

export const COMMENT_FIELDS = ['userName', 'email', 'comment', 'consent'] as const

export function statusOf(result: ActionResult | null): CommentFormStatus {
  if (!result) return 'idle'
  if (result.ok) return 'success'
  switch (result.error) {
    case 'validation':
    case 'consent_required':
      return 'validation'
    case 'unavailable':
      return 'unavailable'
    case 'rate_limited':
      return 'rate_limited'
    default:
      return 'error'
  }
}

export function serverFieldErrors(result: ActionResult | null): Record<string, string> {
  if (!result || result.ok) return {}
  const errors: Record<string, string> = { ...(result.fieldErrors ?? {}) }
  if (result.error === 'consent_required' && !errors.consent) errors.consent = ERROR_KEYS.consent
  return errors
}

export function fieldErrorText(messages: Record<string, string>, field: string, key: string | undefined): string | undefined {
  if (!key) return undefined
  return messages[`${field}:${key}`] ?? messages[key] ?? messages[ERROR_KEYS.required]
}

export function firstInvalidField(errors: Record<string, string>): string | null {
  return COMMENT_FIELDS.find((field) => field in errors) ?? null
}
