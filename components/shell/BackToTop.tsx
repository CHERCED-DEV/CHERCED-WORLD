'use client'

import type { MouseEvent } from 'react'
import { Icon } from '@/components/ui/Icon'
import { isPlainClick, scrollToTop } from '@/lib/fx/scroll-top'
import styles from './SiteFooter.module.scss'

export function BackToTop({ label }: { label: string }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isPlainClick(event)) return
    event.preventDefault()
    scrollToTop()
  }

  return (
    <a href="#header" className={styles.backToTop} data-cw-back-to-top="" onClick={onClick}>
      <span className={styles.backToTopIcon}>
        <Icon name="arrow-up" size={18} />
      </span>
      <span className={styles.backToTopLabel}>{label}</span>
    </a>
  )
}
