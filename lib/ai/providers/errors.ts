import { safeReason } from './redact'
import type { TokenUsage } from './types'

export const FAILURE_KINDS = ['rate_limit', 'server', 'timeout', 'network', 'unavailable', 'refusal', 'request', 'invalid'] as const

export type FailureKind = (typeof FAILURE_KINDS)[number]

export class ProviderCallError extends Error {
  constructor(
    readonly kind: FailureKind,
    message: string,
    readonly usage: TokenUsage | null = null,
    readonly model: string | null = null,
  ) {
    super(safeReason(message))
    this.name = 'ProviderCallError'
  }
}

export function failsOver(kind: FailureKind): boolean {
  return kind !== 'request'
}

export function kindFromStatus(status: number): FailureKind {
  if (status === 429) return 'rate_limit'
  if (status === 408) return 'timeout'
  if (status === 409 || status >= 500) return 'server'
  if (status === 401 || status === 402 || status === 403 || status === 404) return 'unavailable'
  return 'request'
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
}

export function asProviderError(error: unknown, label: string): ProviderCallError {
  if (error instanceof ProviderCallError) return error
  if (isTimeoutError(error)) return new ProviderCallError('timeout', `${label}: tiempo agotado`)
  return new ProviderCallError('network', `${label}: ${safeReason(error)}`)
}
