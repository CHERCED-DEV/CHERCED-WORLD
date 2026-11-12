export const HONEYPOT_FIELD = 'website'

export const RENDERED_AT_FIELD = 'renderedAt'

export const MIN_FILL_MS = 3000

export const CLOCK_SKEW_MS = 5 * 60 * 1000

type FieldSource = { get(name: string): FormDataEntryValue | null }

export function isHoneypotFilled(form: FieldSource): boolean {
  const value = form.get(HONEYPOT_FIELD)
  return typeof value === 'string' ? value.trim() !== '' : value !== null
}

export function parseRenderedAt(form: FieldSource): number | null {
  const raw = form.get(RENDERED_AT_FIELD)
  if (typeof raw !== 'string' || !/^\d{10,16}$/.test(raw.trim())) return null
  const value = Number(raw.trim())
  return Number.isSafeInteger(value) ? value : null
}

export function isTooFast(form: FieldSource, now: Date): boolean {
  const renderedAt = parseRenderedAt(form)
  if (renderedAt === null) return true
  const elapsed = now.getTime() - renderedAt
  return elapsed < -CLOCK_SKEW_MS || (elapsed >= 0 && elapsed < MIN_FILL_MS)
}
