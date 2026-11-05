import { site } from '@/content/site'
import type { Locale } from '@/lib/i18n/config'
import { buttonClassName, type ButtonSize } from './Button'
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
