'use client'

import { useSyncExternalStore } from 'react'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'
import { emit, type Theme } from '@/lib/events'
import styles from './controls.module.scss'

function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

function getServerSnapshot(): Theme {
  return 'dark'
}

export function ThemeToggle({ label }: { label: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className={cx(styles.iconButton, 'cw-js-only')}
      aria-pressed={dark}
      aria-label={label}
      title={label}
      data-cw-theme-toggle=""
      onClick={() => emit('cw:theme-change', dark ? 'light' : 'dark')}
    >
      <Icon name={dark ? 'moon' : 'sun'} />
    </button>
  )
}
