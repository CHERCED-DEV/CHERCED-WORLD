'use client'

import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'
import { cx } from '@/components/ui/cx'
import { ALL_TAGS, type TagFilterItem } from './model'
import styles from './TagFilter.module.scss'

let pendingFocus: string | null = null

export function rememberFilterFocus(key: string): void {
  pendingFocus = key
}

export function takeFilterFocus(): string | null {
  const key = pendingFocus
  pendingFocus = null
  return key
}

export function centeredScrollLeft(scroller: { clientWidth: number; scrollWidth: number }, item: { offsetLeft: number; offsetWidth: number }): number {
  const max = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
  const centered = item.offsetLeft - (scroller.clientWidth - item.offsetWidth) / 2
  return Math.round(Math.min(max, Math.max(0, centered)))
}

export function FilterLink({
  filterKey,
  href,
  className,
  current,
  lang,
  children,
}: {
  filterKey: string
  href: string
  className?: string
  current?: boolean
  lang?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      scroll={false}
      prefetch={false}
      className={className}
      aria-current={current ? 'page' : undefined}
      lang={lang}
      onClick={() => rememberFilterFocus(filterKey)}
      data-cw-tag-filter={filterKey}
    >
      {children}
    </Link>
  )
}

export function TagFilter({ items, active, labelledBy }: { items: readonly TagFilterItem[]; active: string; labelledBy: string }) {
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const current = list.querySelector<HTMLElement>('[aria-current="page"]')
    if (current && list.scrollWidth > list.clientWidth) list.scrollLeft = centeredScrollLeft(list, current)
    const key = takeFilterFocus()
    if (key === null) return
    const target = [...list.querySelectorAll<HTMLElement>('[data-cw-tag-filter]')].find((element) => element.dataset.cwTagFilter === key)
    target?.focus({ preventScroll: true })
  }, [active])

  return (
    <nav aria-labelledby={labelledBy} className={styles.nav} data-cw-tag-nav="">
      <ul ref={listRef} className={styles.list}>
        {items.map((item) => (
          <li key={item.key}>
            <FilterLink
              filterKey={item.key}
              href={item.href}
              current={item.key === active}
              lang={item.lang}
              className={cx(styles.chip, item.key === ALL_TAGS && styles.all)}
            >
              {item.key === active ? <span aria-hidden="true" className={styles.dot} /> : null}
              {item.label}
            </FilterLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
