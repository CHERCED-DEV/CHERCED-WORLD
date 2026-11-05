import { getSite } from '@/lib/content'

const site = getSite()

function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const current = site.about.career[0]
if (!current || current.end !== null) throw new Error('la primera entrada de la carrera debería ser el empleo actual')

export const EMPLOYER = fold(current.company)

export function mentionsEmployer(text: string): boolean {
  return fold(text).includes(EMPLOYER)
}

export function quantities(text: string): string[] {
  const found = [
    ...text.matchAll(/\d[\d.,]*\s?[+%]/g),
    ...text.matchAll(/[~≈]\s?\d/g),
    ...text.matchAll(/(?<![\w.])\d{2,}(?![\w])/g),
  ]
  return found.map((match) => match[0])
}

const NOT_PROSE = /^(\d{4}(-\d{2}){0,2}(T[\d:.]+Z?)?|\d{4}\s?[-–]\s?\d{4}|\/\S*|https?:\/\/\S+|#[\w-]+|[\w-]+\.(svg|png|webp|avif|jpe?g))$/i

export function isProse(text: string): boolean {
  return !NOT_PROSE.test(text.trim())
}

const PERSONAL: ReadonlyArray<[string, RegExp]> = [
  ['correo', /[\w.+-]+@[\w-]+(\.[\w-]+)+/g],
  ['teléfono', /(?<![\d-])(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?![\d-])/g],
  ['IP', /(?<![\d.])\d{1,3}(\.\d{1,3}){3}(?![\d.])/g],
  ['huella', /\b[a-f0-9]{32,}\b/gi],
  ['credencial', /mongodb(\+srv)?:\/\/|MONGODB_INTEGRAL_DB|VERCEL_URL_CORS|-----BEGIN/gi],
]

export function personalData(text: string, allowedEmails: readonly string[] = []): string[] {
  const findings: string[] = []
  for (const [kind, pattern] of PERSONAL) {
    for (const match of text.matchAll(pattern)) {
      if (kind === 'correo' && allowedEmails.includes(match[0].toLowerCase())) continue
      findings.push(`${kind}: ${match[0].slice(0, 40)}`)
    }
  }
  return findings
}

export function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

export function records(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) return value.flatMap(records)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return [record, ...Object.values(record).flatMap(records)]
  }
  return []
}

export function expandJson(value: unknown): unknown {
  if (typeof value === 'string' && /^\s*[[{]/.test(value)) {
    try {
      return expandJson(JSON.parse(value))
    } catch {
      return value
    }
  }
  if (Array.isArray(value)) return value.map(expandJson)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, expandJson(item)]))
  return value
}

export function confidentialityFindings(value: unknown, sensitiveIds: readonly string[]): string[] {
  const findings: string[] = []
  for (const record of records(expandJson(value))) {
    const texts = Object.values(record).filter((field): field is string => typeof field === 'string')
    const aboutEmployer = texts.some(mentionsEmployer)
    const aboutSensitive = typeof record.id === 'string' && sensitiveIds.includes(record.id)
    if (!aboutEmployer && !aboutSensitive) continue
    for (const text of strings(record).filter(isProse)) {
      if (aboutSensitive && text === record.id) continue
      const found = quantities(text)
      if (found.length > 0) findings.push(`${aboutEmployer ? 'empleador' : `caso ${String(record.id)}`}: "${text.slice(0, 60)}" trae ${found.join(', ')}`)
    }
  }
  return [...new Set(findings)]
}

export function pngSize(body: Buffer): { width: number; height: number } | null {
  const signature = '89504e470d0a1a0a'
  if (body.length < 24 || body.subarray(0, 8).toString('hex') !== signature) return null
  return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) }
}
