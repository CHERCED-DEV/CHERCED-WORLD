'use client'

import { useEffect, useState } from 'react'
import type { TocHeading } from '@/lib/blog/outline'
import { activeHeading, spyLine } from '@/lib/blog/progress'
import type { Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { headerOffset, onScrollFrame } from './scroll'
import styles from './Toc.module.scss'

export const TOC_TITLE_ID = 'cw-toc-title'

export function Toc({ headings, title, contentLang, className }: { headings: TocHeading[]; title: string; contentLang?: Locale; className?: string }) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => element !== null)
    if (elements.length === 0) return
    return onScrollFrame(() => {
      const tops = elements.map((element) => ({ id: element.id, top: element.getBoundingClientRect().top }))
      const next = activeHeading(tops, spyLine(window.innerHeight, headerOffset()))
      setActive((current) => (current === next ? current : next))
    })
  }, [headings])

  return (
    <nav className={cx(styles.toc, className)} aria-labelledby={TOC_TITLE_ID} data-cw-toc="">
      <h2 id={TOC_TITLE_ID} className={styles.title}>
        {title}
      </h2>
      <ol className={styles.list} lang={contentLang}>
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? styles.sub : undefined}>
            <a
              href={`#${heading.id}`}
              className={styles.link}
              aria-current={active === heading.id ? 'location' : undefined}
              data-cw-toc-link={heading.id}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
