'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import styles from './controls.module.scss'

export function parentPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 3) return null
  return `/${segments.slice(0, -1).join('/')}`
}

export function BackLink({ label }: { label: string }) {
  const parent = parentPath(usePathname() ?? '')
  if (!parent) return null
  return (
    <Link href={parent} className={styles.back} data-cw-back="">
      <Icon name="back" />
      <span className={styles.collapsibleLabel}>{label}</span>
    </Link>
  )
}
