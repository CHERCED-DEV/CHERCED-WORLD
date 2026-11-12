'use client'

import { useCallback, useRef, useState, type ComponentType } from 'react'
import { cx } from '@/components/ui/cx'
import type { Locale } from '@/lib/i18n/config'
import type { BuddyProps } from './Buddy'
import type { Point } from './logic'
import styles from './NoTocar.module.scss'

type Awake = { Buddy: ComponentType<BuddyProps>; origin: Point; wakes: number }

export function NoTocarButton({ lang, label }: { lang: Locale; label: string }) {
  const [awake, setAwake] = useState<Awake | null>(null)
  const [ready, setReady] = useState(false)
  const loading = useRef(false)
  const press = useRef<(() => void) | null>(null)

  const bindPress = useCallback((handler: (() => void) | null) => {
    press.current = handler
  }, [])
  const onCalmable = useCallback(() => setReady(true), [])
  const onGone = useCallback(() => {
    setAwake(null)
    setReady(false)
  }, [])

  function touch(button: HTMLButtonElement) {
    if (awake) {
      press.current?.()
      return
    }
    if (loading.current) return
    loading.current = true
    const rect = button.getBoundingClientRect()
    const origin = { x: rect.left + rect.width / 2, y: rect.top }
    import('./Buddy')
      .then((loaded) => setAwake({ Buddy: loaded.Buddy, origin, wakes: loaded.wakeUp() }))
      .catch(() => {})
      .finally(() => {
        loading.current = false
      })
  }

  return (
    <>
      <button
        type="button"
        className={cx(styles.button, 'cw-js-only')}
        data-cw-no-tocar=""
        data-awake={awake ? '' : undefined}
        data-ready={ready ? '' : undefined}
        onClick={(event) => touch(event.currentTarget)}
      >
        <svg className={styles.icon} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M8 1.5 15 14H1L8 1.5Z" className={styles.sign} />
          <path d="M8 6v4M8 11.5v1" className={styles.mark} />
        </svg>
        <span>{label}</span>
      </button>
      {awake ? (
        <awake.Buddy lang={lang} origin={awake.origin} wakes={awake.wakes} bindPress={bindPress} onCalmable={onCalmable} onGone={onGone} />
      ) : null}
    </>
  )
}
