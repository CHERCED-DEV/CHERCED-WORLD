import { z } from 'zod'
import { PHOTO_SOURCES, PROFILE_REASONS, type AvatarType } from '@/lib/data/types'
import { COUNTRY_CODES, PROFILE_LANGUAGES, PROFILE_LANGUAGES_MAX, PROFILE_TEXT_MAX, REASON_NOTE_MAX } from './profile-options'

export * from './profile-options'

const COUNTRY_SET = new Set(COUNTRY_CODES)

const LANGUAGE_SET = new Set<string>(PROFILE_LANGUAGES)

export const GOOGLE_PICTURE_MAX = 2048

const GITHUB_HANDLE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/

const LINKEDIN_SLUG = /^[A-Za-z0-9\-_%]{3,100}$/

export function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim() : ''
}

export function linkedinUrl(value: unknown): string | null | undefined {
  const raw = cleanText(value)
  if (!raw) return null
  const bare = /^@?([A-Za-z0-9\-_]{3,100})$/.exec(raw)
  if (bare) return `https://www.linkedin.com/in/${bare[1]}`
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const host = url.hostname.toLowerCase()
    if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) return undefined
    const [kind, slug] = url.pathname.split('/').filter(Boolean)
    if (kind !== 'in' || !slug || !LINKEDIN_SLUG.test(slug)) return undefined
    return `https://www.linkedin.com/in/${slug}`
  } catch {
    return undefined
  }
}

export function githubHandle(value: unknown): string | null | undefined {
  const raw = cleanText(value).replace(/^@/, '')
  if (!raw) return null
  let handle = raw
  if (/github\.com/i.test(raw)) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
      const host = url.hostname.toLowerCase()
      if (host !== 'github.com' && host !== 'www.github.com') return undefined
      handle = url.pathname.split('/').filter(Boolean)[0] ?? ''
    } catch {
      return undefined
    }
  }
  return GITHUB_HANDLE.test(handle) ? handle : undefined
}

export function googlePicture(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > GOOGLE_PICTURE_MAX) return null
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || !(host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com'))) return null
    return url.toString()
  } catch {
    return null
  }
}

const optionalText = (max: number) =>
  z.preprocess(
    (value) => cleanText(value),
    z
      .string()
      .max(max, { error: 'tooLong' })
      .transform((value) => (value === '' ? null : value)),
  )

function normalized(normalize: (value: unknown) => string | null | undefined) {
  return z.unknown().transform((value, context) => {
    const result = normalize(value)
    if (result === undefined) {
      context.addIssue({ code: 'custom', message: 'invalid' })
      return z.NEVER
    }
    return result
  })
}

export const profileFieldsSchema = z.object({
  country: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim().toUpperCase() : null),
    z
      .string()
      .refine((code) => COUNTRY_SET.has(code), { error: 'invalid' })
      .nullable(),
  ),
  city: optionalText(PROFILE_TEXT_MAX),
  role: optionalText(PROFILE_TEXT_MAX),
  company: optionalText(PROFILE_TEXT_MAX),
  linkedin: normalized(linkedinUrl),
  github: normalized(githubHandle),
  languages: z
    .array(z.string())
    .max(PROFILE_LANGUAGES_MAX, { error: 'tooMany' })
    .refine((list) => list.every((code) => LANGUAGE_SET.has(code)), { error: 'invalid' })
    .transform((list) => PROFILE_LANGUAGES.filter((code) => list.includes(code)) as string[]),
  reason: z.preprocess(
    (value) => (typeof value === 'string' && value !== '' ? value : null),
    z.enum(PROFILE_REASONS, { error: 'invalid' }).nullable(),
  ),
  reasonNote: optionalText(REASON_NOTE_MAX),
})

const emptyToNull = (value: unknown) => (value === '' || value == null ? null : value)

export const preferencesSchema = z.object({
  lang: z.preprocess(emptyToNull, z.enum(['es', 'en']).nullable()),
  theme: z.preprocess(emptyToNull, z.enum(['dark', 'light']).nullable()),
})

export const photoSourceSchema = z.enum(PHOTO_SOURCES)

export function profileFieldsFrom(form: FormData): unknown {
  return {
    country: form.get('country'),
    city: form.get('city'),
    role: form.get('role'),
    company: form.get('company'),
    linkedin: form.get('linkedin'),
    github: form.get('github'),
    languages: form.getAll('languages').filter((item): item is string => typeof item === 'string'),
    reason: form.get('reason'),
    reasonNote: form.get('reasonNote'),
  }
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    errors[key] ??= issue.message === 'tooLong' || issue.message === 'tooMany' ? issue.message : 'invalid'
  }
  return errors
}

export function sniffAvatar(bytes: Uint8Array): AvatarType | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to))
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  return null
}
