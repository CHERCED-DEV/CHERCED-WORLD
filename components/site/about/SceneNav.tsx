'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import { useMediaQuery, useScrollDirection, type ScrollDirection } from '@/lib/fx/viewport'
import styles from './SceneNav.module.scss'

export type Scene = { id: string; label: string }

export const SCENE_TAB_QUERY = '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)'

export const SCENE_TAB_RELEASE = 48

export type SceneTabState = 'open' | 'compact'

export function sceneTabState({
  compactable,
  direction,
  pinned,
  focused,
}: {
  compactable: boolean
  direction: ScrollDirection
  pinned: boolean
  focused: boolean
}): SceneTabState {
  return compactable && direction === 'down' && !pinned && !focused ? 'compact' : 'open'
}

export type SceneTabMetrics = {
  track: number
  start: number
  end: number
  badge: number
  scroll: number
  width: number
  lefts: number[]
}

export function sceneTabGeometry({ track, start, end, badge, scroll, width, lefts }: SceneTabMetrics): { shift: number; pulls: number[] } {
  const shift = Math.max(0, Math.round(track - (start + badge + width + end)))
  return { shift, pulls: lefts.map((left) => Math.round(shift + start + badge - left + scroll)) }
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function SceneNav({ label, scenes }: { label: string; scenes: Scene[] }) {
  const [current, setCurrent] = useState(scenes[0]?.id ?? '')
  const [footer, setFooter] = useState(false)
  const [pin, setPin] = useState<number | null>(null)
  const [focused, setFocused] = useState(false)
  const compactable = useMediaQuery(SCENE_TAB_QUERY)
  const direction = useScrollDirection()
  const compact = sceneTabState({ compactable, direction, pinned: pin !== null, focused }) === 'compact'
  const navRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)
  const placed = useRef<{ id: string; x: number; width: number } | null>(null)
  const pressedCompact = useRef(false)
  const position = Math.max(0, scenes.findIndex((scene) => scene.id === current))

  const place = useCallback(() => {
    const nav = navRef.current
    const track = trackRef.current
    const list = listRef.current
    const indicator = indicatorRef.current
    const items = list ? [...list.children].filter((node): node is HTMLElement => node instanceof HTMLElement) : []
    const item = items[position]
    if (!nav || !track || !list || !indicator || !item) return
    const style = getComputedStyle(list)
    const { shift, pulls } = sceneTabGeometry({
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
      if (Math.abs(window.scrollY - pin) > SCENE_TAB_RELEASE) setPin(null)
    }
    window.addEventListener('scroll', release, { passive: true })
    return () => window.removeEventListener('scroll', release)
  }, [pin])

  useEffect(() => {
    const targets = scenes.map((scene) => document.getElementById(scene.id)).filter((node): node is HTMLElement => node !== null)
    if (targets.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        let best = ''
        let ratio = 0
        for (const scene of scenes) {
          const value = visible.get(scene.id) ?? 0
          if (value > ratio) {
            ratio = value
            best = scene.id
          }
        }
        if (best) setCurrent(best)
      },
      { rootMargin: '-120px 0px -35% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    )
    for (const target of targets) observer.observe(target)
    return () => observer.disconnect()
  }, [scenes])

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

  return (
    <>
      <nav
        ref={navRef}
        className={styles.sceneNav}
        aria-label={label}
        data-cw-scene-nav=""
        data-cw-compact={compact ? '' : undefined}
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
            {String(position + 1).padStart(2, '0')}
          </span>
          <div ref={trackRef} className={styles.track}>
            <span ref={indicatorRef} className={styles.sceneIndicator} aria-hidden="true" data-cw-scene-indicator="" />
            <ol ref={listRef} className={styles.sceneList}>
              {scenes.map((scene, index) => (
                <li key={scene.id} className={styles.sceneItem} data-current={current === scene.id ? '' : undefined}>
                  <a
                    href={`#${scene.id}`}
                    className={styles.sceneLink}
                    aria-current={current === scene.id ? 'true' : undefined}
                    data-cw-scene-link={scene.id}
                    onClick={() => {
                      setCurrent(scene.id)
                      setPin(null)
                    }}
                  >
                    <span className={styles.sceneIndex} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {scene.label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </nav>
      <div className={styles.sceneDots} aria-hidden="true" data-cw-scene-dots="" data-cw-over-footer={footer ? '' : undefined}>
        {scenes.map((scene) => (
          <button
            key={scene.id}
            type="button"
            tabIndex={-1}
            className={styles.sceneDot}
            title={scene.label}
            data-current={current === scene.id ? '' : undefined}
            data-cw-scene-dot={scene.id}
            onClick={() => goTo(scene.id)}
          />
        ))}
      </div>
    </>
  )
}
