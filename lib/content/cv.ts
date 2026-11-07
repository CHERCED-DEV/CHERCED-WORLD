import { site } from '@/content/site'
import type { CvPdf, Locale, SiteContent } from '@/content/types'
import { otherLocale } from '@/lib/i18n/config'

export function cvPdfs(lang: Locale, content: SiteContent = site): CvPdf[] {
  const pdfs = content.profile?.cv.pdfs ?? []
  return [lang, otherLocale(lang)].flatMap((locale) => pdfs.filter((pdf) => pdf.lang === locale))
}
