'use client'

import { useEffect, useRef } from 'react'
import { readingProgress } from '@/lib/blog/progress'
import { cx } from '@/components/ui/cx'
import styles from './ReadingProgress.module.scss'
import { headerOffset, onScrollFrame, ownPost } from './scroll'

export const READING_LINE_SELECTOR = '[data-cw-reading-line]'

export function ReadingProgress({ target: selector }: { target: string }) {
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = bar.current
    const post = ownPost(element)
    const target = post?.querySelector(selector)
    if (!element || !post || !target) return
    const paint = (value: string) => {
      element.style.setProperty('--cw-progress', value)
      for (const line of post.querySelectorAll<HTMLElement>(READING_LINE_SELECTOR)) line.style.setProperty('--cw-progress', value)
    }
    paint('0')
    element.dataset.cwReadingProgress = '0.00'
    return onScrollFrame(() => {
      const box = target.getBoundingClientRect()
      const value = readingProgress({ top: box.top, height: box.height }, window.innerHeight, headerOffset())
      paint(value.toFixed(4))
      element.dataset.cwReadingProgress = value.toFixed(2)
    }, target)
  }, [selector])

  return <div ref={bar} className={cx('cw-js-only', styles.progress)} aria-hidden="true" data-cw-reading-progress="0.00" />
}
