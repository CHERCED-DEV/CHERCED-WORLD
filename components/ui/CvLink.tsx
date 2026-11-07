import { site } from '@/content/site'
import type { CvPdf } from '@/content/types'
import { formatBytes } from '@/lib/ailab/core/format'
import { cvPdfs } from '@/lib/content/cv'
import type { Locale } from '@/lib/i18n/config'
import { buttonClassName, type ButtonSize } from './Button'
import styles from './CvLink.module.scss'
import { cx } from './cx'
import { Icon } from './Icon'
import { sharedText } from './sharedText'

export type CvLinkProps = { lang: Locale; variant?: 'solid' | 'glass'; size?: ButtonSize; className?: string }

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

export function cvPdfFormat(pdf: Pick<CvPdf, 'bytes'>, lang: Locale): string {
  return sharedText(lang, 'common', 'cv.format', { size: formatBytes(pdf.bytes, lang) })
}

export function CvDownload({ lang, variant = 'glass', size = 'md', className }: CvLinkProps) {
  const [pdf] = cvPdfs(lang)
  if (!pdf) return null
  return (
    <a
      href={pdf.href}
      download={pdf.filename}
      type="application/pdf"
      hrefLang={pdf.lang}
      aria-label={sharedText(lang, 'common', 'cv.downloadLabel', { size: formatBytes(pdf.bytes, lang) })}
      className={buttonClassName({ variant, size, className })}
      data-cw-cv-download=""
      data-cw-cv-lang={pdf.lang}
    >
      <span>{sharedText(lang, 'common', 'cv.download')}</span>
      <span className={styles.format}>{cvPdfFormat(pdf, lang)}</span>
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
