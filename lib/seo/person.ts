import commonEn from '@/content/i18n/en/common.json'
import commonEs from '@/content/i18n/es/common.json'
import { site } from '@/content/site'
import { cvPdfs } from '@/lib/content/cv'
import type { Locale } from '@/lib/i18n/config'
import { getSiteUrl } from '@/lib/site-url'

export const PERSON_NAME: string = commonEs['brand.author']

export const PERSON_ALTERNATE_NAMES = ['Camilo Hernandez', 'Camilo Hernández Cediel', 'Camilo Alonso Hernández Cediel', 'CHERCED'] as const

export const PERSON_JOB_TITLE = 'Software Solutions Engineer'

export const PERSON_ADDRESS = { addressLocality: 'Armenia', addressCountry: 'CO' } as const

export const PERSON_KNOWS_ABOUT = ['Software architecture', 'Microservices', 'Micro-frontends', '.NET Core', 'Angular'] as const

const DESCRIPTIONS: Record<Locale, string> = { es: commonEs['meta.description'], en: commonEn['meta.description'] }

export type PersonJsonLd = {
  '@context': 'https://schema.org'
  '@type': 'Person'
  '@id': string
  name: string
  alternateName: string[]
  jobTitle: string
  description: string
  url: string
  image: string
  sameAs: string[]
  address: { '@type': 'PostalAddress'; addressLocality: string; addressCountry: string }
  alumniOf: { '@type': 'CollegeOrUniversity'; name: string }
  knowsAbout: string[]
  subjectOf?: CvDocumentJsonLd
}

export type CvDocumentJsonLd = {
  '@type': 'DigitalDocument'
  name: string
  url: string
  encodingFormat: 'application/pdf'
  inLanguage: Locale
}

const CV_NAMES: Record<Locale, string> = { es: commonEs['cv.documentName'], en: commonEn['cv.documentName'] }

function cvDocument(lang: Locale, root: string): CvDocumentJsonLd | null {
  const [pdf] = cvPdfs(lang, site)
  if (!pdf) return null
  return {
    '@type': 'DigitalDocument',
    name: CV_NAMES[lang].replace('{name}', PERSON_NAME),
    url: `${root}${pdf.href}`,
    encodingFormat: 'application/pdf',
    inLanguage: pdf.lang,
  }
}

function origin(base: URL): string {
  return base.origin
}

export function personId(base: URL = getSiteUrl()): string {
  return `${origin(base)}/#person`
}

export function personSameAs(content: typeof site = site): string[] {
  const socials = (['linkedin', 'github', 'instagram'] as const).flatMap((id) => {
    const href = content.socials.find((social) => social.id === id)?.href
    return href ? [href] : []
  })
  return [...new Set([...socials, content.about.courses.platzi.href])]
}

export function personJsonLd(lang: Locale, base: URL = getSiteUrl()): PersonJsonLd {
  const root = origin(base)
  const sameAs = personSameAs()
  const alumni = site.about.education.find((entry) => entry.id === 'eam')?.institution ?? ''
  const cv = cvDocument(lang, root)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': personId(base),
    name: PERSON_NAME,
    alternateName: [...PERSON_ALTERNATE_NAMES],
    jobTitle: PERSON_JOB_TITLE,
    description: DESCRIPTIONS[lang],
    url: `${root}/`,
    image: `${root}${site.about.image.src}`,
    sameAs,
    address: { '@type': 'PostalAddress', ...PERSON_ADDRESS },
    alumniOf: { '@type': 'CollegeOrUniversity', name: alumni },
    knowsAbout: [...PERSON_KNOWS_ABOUT],
    ...(cv ? { subjectOf: cv } : {}),
  }
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
