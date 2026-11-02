import type { ActionResult } from '@/lib/actions/result'

export type ResultLabels = {
  unauthorized: string
  notFound: string
  validation: string
  unavailable: string
  rateLimited: string
  notCompleted: string
}

export function notCompletedTitle(labels: ResultLabels, action: string): string {
  return labels.notCompleted.replace('{action}', action)
}

export function failureText(result: ActionResult, labels: ResultLabels): string | null {
  if (result.ok) return null
  switch (result.error) {
    case 'unauthorized':
      return labels.unauthorized
    case 'not_found':
      return labels.notFound
    case 'validation':
    case 'consent_required':
      return labels.validation
    case 'rate_limited':
      return labels.rateLimited
    default:
      return labels.unavailable
  }
}
