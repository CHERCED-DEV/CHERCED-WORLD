'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import styles from './controls.module.scss'
import { inPrivatePanel, parentPath } from './nav'

export function BackLink({ label }: { label: string }) {
  const pathname = usePathname() ?? ''
  const parent = parentPath(pathname)
  if (!parent) return null
  return (
    <Link href={parent} prefetch={inPrivatePanel(pathname) ? false : undefined} className={styles.back} data-cw-back="">
      <Icon name="back" />
      <span className={styles.collapsibleLabel}>{label}</span>
    </Link>
  )
}
