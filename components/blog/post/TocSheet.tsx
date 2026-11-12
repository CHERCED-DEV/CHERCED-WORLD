'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import type { TocHeading } from '@/lib/blog/outline'
import { useMediaQuery } from '@/lib/fx/viewport'
import type { Locale } from '@/lib/i18n'
import { sectionNumber } from '@/components/site/section-nav/model'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { cx } from '@/components/ui/cx'
import { headerOffset, onScrollFrame, ownPost } from '../scroll'
import { TocList, useActiveHeading } from '../Toc'
import styles from './TocSheet.module.scss'

export const TOC_SHEET_TITLE_ID = 'cw-toc-sheet-title'

export const TOC_SHEET_QUERY = '(max-width: 1247.98px)'

export type TocSheetLabels = { title: string; close: string }

export function tocButtonShown(toc: { bottom: number } | null, body: { bottom: number } | null, offset: number): boolean {
  if (!toc || !body) return false
  return toc.bottom <= offset && body.bottom > offset
}

export function tocChapter(headings: readonly TocHeading[], active: string | null): { number: string; text: string } | null {
  let position = -1
  let chapter: TocHeading | null = null
  for (const heading of headings) {
    if (heading.level === 2) {
      position += 1
      chapter = heading
    }
    if (heading.id === active) return chapter ? { number: sectionNumber(position), text: chapter.text } : null
  }
  return null
}

function goToHeading(id: string) {
  const target = document.getElementById(id)
  if (!target) return
  if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
  target.scrollIntoView({ block: 'start' })
  if (!target.hasAttribute('tabindex')) target.tabIndex = -1
  target.focus({ preventScroll: true })
}

export function TocSheet({ headings, labels, contentLang }: { headings: TocHeading[]; labels: TocSheetLabels; contentLang?: Locale }) {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const pending = useRef<string | null>(null)
  const compact = useMediaQuery(TOC_SHEET_QUERY)
  const active = useActiveHeading(headings, button, compact || open)
  const chapter = tocChapter(headings, active)

  useEffect(() => {
    if (!compact) return
    const post = ownPost(button.current)
    const toc = post?.querySelector('[data-cw-toc]') ?? null
    const body = post?.querySelector('[data-cw-post-body]') ?? null
    if (!toc || !body) return
    return onScrollFrame(() => {
      const next = tocButtonShown(toc.getBoundingClientRect(), body.getBoundingClientRect(), headerOffset())
      setShown((current) => (current === next ? current : next))
    }, body)
  }, [compact])

  useEffect(() => {
    const onClose = (event: Event) => {
      const id = pending.current
      const dialog = event.target
      if (!id || !(dialog instanceof HTMLDialogElement) || !list.current || !dialog.contains(list.current)) return
      pending.current = null
      goToHeading(id)
    }
    document.addEventListener('close', onClose, true)
    return () => document.removeEventListener('close', onClose, true)
  }, [])

  const onNavigate = (id: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    pending.current = id
    setOpen(false)
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        className={cx('cw-js-only', styles.button)}
        aria-haspopup="dialog"
        title={labels.title}
        data-cw-toc-button=""
        data-state={(compact && shown) || open ? 'shown' : 'hidden'}
        onClick={() => setOpen(true)}
      >
        <span className="cw-visually-hidden">{chapter ? `${labels.title}: ` : labels.title}</span>
        {chapter ? (
          <span className={styles.badge} data-cw-toc-chapter-number="">
            {chapter.number}
          </span>
        ) : null}{' '}
        <span className={styles.pill}>
          <span className={styles.title} lang={contentLang} aria-hidden={chapter ? undefined : 'true'} data-cw-toc-chapter="">
            {chapter ? chapter.text : labels.title}
          </span>
          <span className={styles.line} aria-hidden="true" data-cw-reading-line="" />
        </span>
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={TOC_SHEET_TITLE_ID}
        title={labels.title}
        closeLabel={labels.close}
      >
        <div ref={list} className={styles.list} data-cw-toc-sheet="">
          <TocList headings={headings} active={active} contentLang={contentLang} linkAttribute="data-cw-toc-sheet-link" onNavigate={onNavigate} />
        </div>
      </BottomSheet>
    </>
  )
}
