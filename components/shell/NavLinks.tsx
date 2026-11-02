'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@/components/ui/cx'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import type { NavItem } from './nav'
import styles from './SiteHeader.module.scss'

export type NavLinksProps = {
  lang: Locale
  items: NavItem[]
  label: string
  variant: 'bar' | 'menu'
  onNavigate?: () => void
}

export function NavLinks({ lang, items, label, variant, onNavigate }: NavLinksProps) {
  const pathname = usePathname() ?? ''

  return (
    <nav aria-label={label} className={cx(styles.nav, variant === 'bar' ? styles.navBar : styles.navMenu)}>
      <ul className={styles.navList}>
        {items.map((item) => {
          const href = localizedPath(lang, item.path)
          const current = pathname === href
          const inSection = !current && item.path !== '/' && pathname.startsWith(`${href}/`)
          return (
            <li key={item.path}>
              <Link
                href={href}
                className={styles.navLink}
                aria-current={current ? 'page' : undefined}
                data-active={current || inSection ? '' : undefined}
                onClick={onNavigate}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
