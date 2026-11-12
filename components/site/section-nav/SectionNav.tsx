'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react'
import { useMediaQuery, useScrollDirection } from '@/lib/fx/viewport'
import {
  activeSection,
  navSections,
  readingLine,
  SECTION_TAB_QUERY,
  SECTION_TAB_RELEASE,
  sectionNumber,
  sectionTabGeometry,
  sectionTabState,
  sectionTimelineCss,
  type NavSection,
} from './model'
import styles from './SectionNav.module.scss'

export type { NavSection } from './model'

export type SectionNavProps = { label: string; sections: readonly NavSection[]; children?: ReactNode }

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function SectionNav({ label, sections: given, children }: SectionNavProps) {
  const sections = useMemo(() => navSections(given), [given])
  const [current, setCurrent] = useState(sections[0]?.id ?? '')
  const [footer, setFooter] = useState(false)
  const [pin, setPin] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const compactable = useMediaQuery(SECTION_TAB_QUERY)
  const direction = useScrollDirection()
  const compact = sectionTabState({ compactable, direction, pinned: pin !== null, focused }) === 'compact'
  const navRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const placed = useRef<{ id: string; x: number; width: number } | null>(null)
  const pressedCompact = useRef(false)
  const position = Math.max(0, sections.findIndex((section) => section.id === current))

  const place = useCallback(() => {
    const nav = navRef.current
    const track = trackRef.current
    const list = listRef.current
    const indicator = indicatorRef.current
    const items = list ? [...list.children].filter((node): node is HTMLElement => node instanceof HTMLElement) : []
    const item = items[position]
    if (!nav || !track || !list || !indicator || !item) return
    const style = getComputedStyle(list)
    const { shift, pulls } = sectionTabGeometry({
      track: track.clientWidth,
      start: Number.parseFloat(style.paddingLeft) || 0,
      end: Number.parseFloat(style.paddingRight) || 0,
      badge: badgeRef.current?.offsetWidth ?? 0,
      scroll: track.scrollLeft,
      width: item.offsetWidth,
      lefts: items.map((node) => node.offsetLeft),
    })
    nav.style.setProperty('--cw-scene-shift', `${shift}px`)
    items.forEach((node, index) => node.style.setProperty('--cw-scene-pull', `${pulls[index]}px`))
    const more = track.scrollWidth - track.clientWidth > 1
    track.toggleAttribute('data-cw-more-start', more && track.scrollLeft > 1)
    track.toggleAttribute('data-cw-more-end', more && track.scrollLeft < track.scrollWidth - track.clientWidth - 1)

    const x = item.offsetLeft
    const width = item.offsetWidth
    const before = placed.current
    const from = before && before.id !== current && nav.hasAttribute('data-cw-measured') ? before : null
    indicator.style.width = `${width}px`
    indicator.style.transition = 'none'
    indicator.style.transform = from ? `translateX(${from.x}px) scaleX(${from.width / width})` : `translateX(${x}px)`
    void indicator.offsetWidth
    indicator.style.transition = ''
    indicator.style.transform = `translateX(${x}px)`
    indicator.style.setProperty('--cw-scene-pull', `${pulls[position]}px`)
    placed.current = { id: current, x, width }
    if (!nav.hasAttribute('data-cw-measured')) {
      void indicator.offsetWidth
      nav.setAttribute('data-cw-measured', '')
    }
  }, [current, position])

  useLayoutEffect(() => {
    place()
  }, [place])

  useEffect(() => {
    const track = trackRef.current
    const list = listRef.current
    if (!track || !list) return
    let frame = 0
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0
        place()
      })
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    observer?.observe(track)
    observer?.observe(list)
    track.addEventListener('scroll', schedule, { passive: true })
    void document.fonts?.ready.then(schedule)
    return () => {
      observer?.disconnect()
      track.removeEventListener('scroll', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [place])

  useEffect(() => {
    if (compact) return
    const track = trackRef.current
    const item = listRef.current?.children[position] as HTMLElement | undefined
    if (!track || !item || track.scrollWidth <= track.clientWidth) return
    const left = item.offsetLeft - (track.clientWidth - item.offsetWidth) / 2
    track.scrollTo({ left: Math.max(0, left), behavior: reducedMotion() ? 'instant' : 'smooth' })
  }, [compact, position])

  useEffect(() => {
    if (pin === null) return
    const release = () => {
      if (Math.abs(window.scrollY - pin) > SECTION_TAB_RELEASE) setPin(null)
    }
    window.addEventListener('scroll', release, { passive: true })
    return () => window.removeEventListener('scroll', release)
  }, [pin])

  useEffect(() => {
    const targets = sections.map((section) => document.getElementById(section.id)).filter((node): node is HTMLElement => node !== null)
    if (targets.length === 0) return
    let frame = 0
    const read = () => {
      frame = 0
      const root = document.documentElement
      const next = activeSection(
        targets.map((target) => ({ id: target.id, top: target.getBoundingClientRect().top })),
        {
          line: readingLine(window.innerHeight, document.getElementById('header')?.getBoundingClientRect().bottom ?? 0),
          viewport: window.innerHeight,
          atEnd: window.scrollY > 0 && window.scrollY + window.innerHeight >= root.scrollHeight - 2,
        },
      )
      if (next) setCurrent(next)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read)
    }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    schedule()
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sections])

  useEffect(() => {
    const footer = document.getElementById('footer')
    if (!footer || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver((entries) => setFooter(entries.some((entry) => entry.isIntersecting)))
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const goTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    setCurrent(id)
    target.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' })
  }

  const onTabClick = (event: MouseEvent<HTMLDivElement>) => {
    const tapped = pressedCompact.current && event.detail > 0
    pressedCompact.current = false
    if (!tapped) return
    event.preventDefault()
    setPin(window.scrollY)
  }

  const onFocus = (event: FocusEvent<HTMLElement>) => {
    if (event.target.matches(':focus-visible')) setFocused(true)
  }

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
  }

  const nav = (
    <>
      <nav
        ref={navRef}
        className={styles.sceneNav}
        aria-label={label}
        data-cw-scene-nav=""
        data-cw-compact={compact ? '' : undefined}
        data-cw-over-footer={footer ? '' : undefined}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <div
          className={styles.tab}
          data-cw-glass="strong"
          data-cw-scene-tab=""
          onPointerDownCapture={() => {
            pressedCompact.current = compact
          }}
          onClick={onTabClick}
        >
          <span ref={badgeRef} className={styles.sceneBadge} aria-hidden="true" data-cw-scene-badge="">
            {sectionNumber(position)}
          </span>
          <div ref={trackRef} className={styles.track}>
            <span ref={indicatorRef} className={styles.sceneIndicator} aria-hidden="true" data-cw-scene-indicator="" />
            <ol ref={listRef} className={styles.sceneList}>
              {sections.map((section, index) => (
                <li key={section.id} className={styles.sceneItem} data-current={current === section.id ? '' : undefined}>
                  <a
                    href={`#${section.id}`}
                    className={styles.sceneLink}
                    aria-current={current === section.id ? 'true' : undefined}
                    data-cw-scene-link={section.id}
                    data-cw-scene-index={index + 1}
                    onClick={() => {
                      setCurrent(section.id)
                      setPin(null)
                    }}
                  >
                    <span className={styles.sceneIndex} aria-hidden="true">
                      {sectionNumber(index)}
                    </span>
                    {section.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </nav>
      <div className={styles.sceneDots} aria-hidden="true" data-cw-scene-dots="" data-cw-over-footer={footer ? '' : undefined}>
        {sections.map((section, index) => (
          <button
            key={section.id}
            type="button"
            tabIndex={-1}
            className={styles.sceneDot}
            title={section.label}
            data-current={current === section.id ? '' : undefined}
            data-cw-scene-dot={section.id}
            data-cw-scene-index={index + 1}
            onClick={() => goTo(section.id)}
          />
        ))}
      </div>
      <style data-cw-scene-timelines="">{sectionTimelineCss(sections)}</style>
    </>
  )
  if (children === undefined) return nav
  return (
    <div data-cw-section-page="">
      {nav}
      {children}
    </div>
  )
}
