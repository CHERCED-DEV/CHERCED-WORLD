import 'server-only'

export const LOG_PREFIX = '[CHERCED-WORLD]'

const SAFE_TOKEN = /^[A-Za-z0-9_.:-]{1,64}$/

function safe(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && SAFE_TOKEN.test(value)) return value
  return null
}

export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return 'UnknownError'
  const details = error as Error & { code?: unknown; codeName?: unknown }
  const parts = [safe(details.name) ?? 'Error']
  const code = safe(details.code)
  const codeName = safe(details.codeName)
  if (code) parts.push(`code=${code}`)
  if (codeName) parts.push(`codeName=${codeName}`)
  return parts.join(' ')
}

export function logServerError(scope: string, error: unknown): void {
  console.error(`${LOG_PREFIX} ${scope}: ${describeError(error)}`)
}
