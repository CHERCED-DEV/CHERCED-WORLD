import { site } from '@/content/site'
import type { CvPdf } from '@/content/types'
import { formatBytes } from '@/lib/ailab/core/format'
import type { Locale } from '@/lib/i18n/config'
import { buttonClassName, type ButtonSize } from './Button'
import { cx } from './cx'
import { Icon } from './Icon'
import { sharedText } from './sharedText'

export type CvLinkProps = { lang: Locale; variant?: 'solid' | 'glass'; size?: ButtonSize; className?: string }

export function cvPdfFilename(pdf: Pick<CvPdf, 'href'>): string {
  return pdf.href.slice(pdf.href.lastIndexOf('/') + 1)
}

export function CvLink({ lang, variant = 'glass', size = 'md', className }: CvLinkProps) {
  const href = site.profile?.cv.href
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={sharedText(lang, 'common', 'cv.linkLabel')}
      className={buttonClassName({ variant, size, className })}
      data-cw-cv-link=""
    >
      <span>{sharedText(lang, 'common', 'cv.link')}</span>
      <Icon name="external" size={16} />
    </a>
  )
}

export function CvDownload({ lang, variant = 'glass', size = 'md', className }: CvLinkProps) {
  const pdf = site.profile?.cv.pdf
  if (!pdf) return null
  return (
    <a
      href={pdf.href}
      download={cvPdfFilename(pdf)}
      type="application/pdf"
      aria-label={sharedText(lang, 'common', 'cv.downloadLabel', { size: formatBytes(pdf.bytes, lang) })}
      className={buttonClassName({ variant, size, className })}
      data-cw-cv-download=""
    >
      <span>{sharedText(lang, 'common', 'cv.download')}</span>
    </a>
  )
}

export type CvActionsProps = CvLinkProps & { downloadVariant?: 'solid' | 'glass' }

export function CvActions({ lang, variant, downloadVariant, size, className }: CvActionsProps) {
  return (
    <span className={cx('cw-cv-actions', className)} data-cw-cv-actions="">
      <CvDownload lang={lang} variant={downloadVariant ?? variant} size={size} />
      <CvLink lang={lang} variant={variant} size={size} />
    </span>
  )
}
