'use client'

import { useEffect, useRef } from 'react'
import { readingProgress } from '@/lib/blog/progress'
import { cx } from '@/components/ui/cx'
import styles from './ReadingProgress.module.scss'
import { headerOffset, onScrollFrame } from './scroll'

export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = bar.current
    const target = document.getElementById(targetId)
    if (!element || !target) return
    return onScrollFrame(() => {
      const box = target.getBoundingClientRect()
      const value = readingProgress({ top: box.top, height: box.height }, window.innerHeight, headerOffset())
      element.style.setProperty('--cw-progress', value.toFixed(4))
      element.dataset.cwReadingProgress = value.toFixed(2)
    }, target)
  }, [targetId])

  return <div ref={bar} className={cx('cw-js-only', styles.progress)} aria-hidden="true" data-cw-reading-progress="0.00" />
}
