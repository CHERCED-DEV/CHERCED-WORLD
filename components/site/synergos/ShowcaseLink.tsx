import Link from 'next/link'
import { buttonClassName, type ButtonSize, type ButtonVariant } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import type { Locale } from '@/lib/i18n'
import { synergosHref } from './model'
import styles from './ShowcaseLink.module.scss'

export type ShowcaseEntry = 'about' | 'home' | 'case'

export type ShowcaseLinkProps = {
  lang: Locale
  label: string
  from: ShowcaseEntry
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

export function ShowcaseLink({ lang, label, from, variant = 'glass', size = 'lg', className }: ShowcaseLinkProps) {
  return (
    <Link href={synergosHref(lang)} className={buttonClassName({ variant, size, className: cx(styles.cta, className) })} data-cw-synergos-cta={from}>
      <span className={styles.dot} aria-hidden="true" />
      <span>{label}</span>
      <svg className={styles.arrow} viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
        <path d="M4 12h15M13 6l6 6-6 6" />
      </svg>
    </Link>
  )
}
