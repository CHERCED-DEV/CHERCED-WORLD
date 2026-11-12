'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './admin.module.scss'

export type PanelTab = { id: string; href: string; label: string; count: number; countLabel: string }

export function NavTabs({ tabs, label }: { tabs: PanelTab[]; label: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label={label}>
      <ul className={styles.tabs}>
        {tabs.map((tab) => (
          <li key={tab.id}>
            <Link href={tab.href} prefetch={false} className={styles.tab} aria-current={pathname === tab.href ? 'page' : undefined}>
              {tab.label}
              {tab.count > 0 ? (
                <>
                  <span className={styles.count} aria-hidden="true" data-cw-count={tab.id}>
                    {tab.count}
                  </span>
                  <span className={styles.srOnly}>{tab.countLabel}</span>
                </>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
