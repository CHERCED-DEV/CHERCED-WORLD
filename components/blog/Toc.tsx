'use client'

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import type { TocHeading } from '@/lib/blog/outline'
import { activeHeading, spyLine } from '@/lib/blog/progress'
import type { Locale } from '@/lib/i18n'
import { cx } from '@/components/ui/cx'
import { headerOffset, onScrollFrame, ownPost } from './scroll'
import styles from './Toc.module.scss'

export const TOC_TITLE_ID = 'cw-toc-title'

export function useActiveHeading(headings: TocHeading[], anchor: RefObject<HTMLElement | null>, enabled = true): string | null {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const post = ownPost(anchor.current)
    if (!post) return
    const elements = headings
      .map((heading) => post.querySelector<HTMLElement>(`[id="${CSS.escape(heading.id)}"]`))
      .filter((element): element is HTMLElement => element !== null)
    if (elements.length === 0) return
    return onScrollFrame(() => {
      const tops = elements.map((element) => ({ id: element.id, top: element.getBoundingClientRect().top }))
      const next = activeHeading(tops, spyLine(window.innerHeight, headerOffset()))
      setActive((current) => (current === next ? current : next))
    })
  }, [headings, anchor, enabled])

  return active
}

export type TocListProps = {
  headings: TocHeading[]
  active: string | null
  contentLang?: Locale
  linkAttribute?: 'data-cw-toc-link' | 'data-cw-toc-sheet-link'
  onNavigate?: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
}

export function TocList({ headings, active, contentLang, linkAttribute = 'data-cw-toc-link', onNavigate }: TocListProps) {
  return (
    <ol className={styles.list} lang={contentLang}>
      {headings.map((heading) => (
        <li key={heading.id} className={heading.level === 3 ? styles.sub : undefined}>
          <a
            href={`#${heading.id}`}
            className={styles.link}
            aria-current={active === heading.id ? 'location' : undefined}
            onClick={onNavigate ? (event) => onNavigate(heading.id, event) : undefined}
            {...{ [linkAttribute]: heading.id }}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ol>
  )
}

export function Toc({ headings, title, contentLang, className }: { headings: TocHeading[]; title: string; contentLang?: Locale; className?: string }) {
  const nav = useRef<HTMLElement>(null)
  const active = useActiveHeading(headings, nav)

  return (
    <nav ref={nav} className={cx(styles.toc, className)} aria-labelledby={TOC_TITLE_ID} data-cw-toc="">
      <h2 id={TOC_TITLE_ID} className={styles.title}>
        {title}
      </h2>
      <TocList headings={headings} active={active} contentLang={contentLang} />
    </nav>
  )
}
