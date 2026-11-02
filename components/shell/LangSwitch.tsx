'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { otherLocale, type Locale } from '@/lib/i18n/config'
import { rememberLocale } from '@/lib/i18n/cookie'
import { switchLocalePath } from '@/lib/i18n/paths'
import styles from './controls.module.scss'

export function LangSwitch({ lang, label, className }: { lang: Locale; label: string; className?: string }) {
  const pathname = usePathname() ?? `/${lang}`
  const target = otherLocale(lang)

  return (
    <Link
      href={switchLocalePath(pathname, target)}
      hrefLang={target}
      lang={target}
      prefetch={false}
      className={cx(styles.pill, className)}
      data-cw-lang-switch=""
      onClick={() => rememberLocale(target)}
    >
      <Icon name="globe" size={18} />
      <span>{label}</span>
    </Link>
  )
}
