export const REDACTED_KEY = '[clave]'

export const REASON_MAX = 200

const KEY_PATTERNS: readonly RegExp[] = [
  /sk-ant-[A-Za-z0-9_-]+/g,
  /sk-(?:proj|svcacct|admin)-[A-Za-z0-9_-]+/g,
  /sk-[A-Za-z0-9_-]{20,}/g,
  /AIza[\w-]+/g,
  /AQ\.[\w-]+/g,
  /Bearer\s+[A-Za-z0-9._~+/=-]{12,}/gi,
]

export function redactKeys(text: string): string {
  return KEY_PATTERNS.reduce((clean, pattern) => clean.replace(pattern, REDACTED_KEY), text)
}

export function safeReason(error: unknown, max = REASON_MAX): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : 'error desconocido'
  const clean = redactKeys(raw).replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean || 'error desconocido'
}
