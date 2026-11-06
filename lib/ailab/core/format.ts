import type { Locale } from '@/lib/i18n/config'

const KILO = 1000

const MEGA = KILO * KILO

const LOCALE_TAG: Record<Locale, string> = { es: 'es-CO', en: 'en-US' }

export function formatBytes(bytes: number, lang: Locale): string {
  if (!Number.isFinite(bytes) || bytes < 0) throw new RangeError(`formatBytes: ${bytes} no es un tamaño`)
  const mega = bytes >= MEGA
  const unit = mega ? 'megabyte' : 'kilobyte'
  const value = bytes / (mega ? MEGA : KILO)
  return new Intl.NumberFormat(LOCALE_TAG[lang], {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value)
}

export function megabytes(value: number): number {
  return Math.round(value * MEGA)
}
