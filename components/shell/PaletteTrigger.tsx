'use client'

import { useEffect } from 'react'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { emit } from '@/lib/events'
import styles from './controls.module.scss'

export function isPaletteShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k'
}

export function PaletteTrigger({ label, hint }: { label: string; hint: string }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isPaletteShortcut(event)) return
      event.preventDefault()
      emit('cw:open-palette')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <button
      type="button"
      className={cx(styles.palette, 'cw-js-only')}
      aria-keyshortcuts="Control+K Meta+K"
      data-cw-palette-trigger=""
      onClick={() => emit('cw:open-palette')}
    >
      <Icon name="search" size={18} />
      <span className={styles.collapsibleLabel}>{label}</span>
      <kbd className={styles.kbd} aria-hidden="true">
        {hint}
      </kbd>
    </button>
  )
}
