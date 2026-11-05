'use client'

import { useEffect, type ReactNode } from 'react'
import { cx } from '@/components/ui/cx'
import { emit } from '@/lib/events'
import { useKeyboardOpen, useMediaQuery, useScrollDirection, type ScrollDirection } from '@/lib/fx/viewport'
import controls from './controls.module.scss'
import styles from './Dock.module.scss'

export const DOCK_QUERY = '(max-width: 767.98px)'

export const DOCK_ATTRIBUTE = 'data-cw-dock'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export type DockState = 'shown' | 'hidden'

export function dockState(direction: ScrollDirection, keyboardOpen: boolean, reducedMotion: boolean): DockState {
  if (keyboardOpen) return 'hidden'
  return direction === 'down' && !reducedMotion ? 'hidden' : 'shown'
}

export function Dock({ children }: { children: ReactNode }) {
  const mobile = useMediaQuery(DOCK_QUERY)
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY)
  const direction = useScrollDirection()
  const keyboard = useKeyboardOpen()

  useEffect(() => {
    const root = document.documentElement
    if (mobile) root.setAttribute(DOCK_ATTRIBUTE, dockState(direction, keyboard, reduced))
    else root.removeAttribute(DOCK_ATTRIBUTE)
  }, [mobile, direction, keyboard, reduced])

  useEffect(() => () => document.documentElement.removeAttribute(DOCK_ATTRIBUTE), [])

  return (
    <div className={styles.dock} data-cw-dock-bar="" data-cw-blur="">
      {children}
    </div>
  )
}

export function DockAssistant({ label }: { label: string }) {
  return (
    <button
      type="button"
      className={cx(controls.iconButton, styles.assistant, 'cw-js-only')}
      aria-label={label}
      aria-haspopup="dialog"
      title={label}
      data-cw-dock-assistant=""
      onClick={() => emit('cw:open-assistant')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 5h16v10H9l-5 4V5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M8 9h8M8 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  )
}
