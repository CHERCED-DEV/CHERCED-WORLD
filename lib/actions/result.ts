export type ActionError =
  | 'validation'
  | 'rate_limited'
  | 'unavailable'
  | 'unauthorized'
  | 'not_found'
  | 'consent_required'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError; fieldErrors?: Record<string, string>; retryAfterMs?: number }

export type ActionFailure = Extract<ActionResult<never>, { ok: false }>

export function ok(): ActionResult<void>
export function ok<T>(data: T): ActionResult<T>
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data }
}

export function fail(
  error: ActionError,
  extra?: { fieldErrors?: Record<string, string>; retryAfterMs?: number },
): ActionFailure {
  return { ok: false, error, ...extra }
}
