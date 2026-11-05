'use client'

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './cx'
import styles from './EmailMenu.module.scss'
import { useToast } from './Toast'

export type EmailMenuLabels = { menu: string; write: string; copy: string; copied: string; copyFailed: string }

export type EmailMenuPlacement = 'top' | 'bottom'

export type EmailMenuButtonProps = {
  email: string
  labels: EmailMenuLabels
  trigger: ReactNode
  className?: string
  placement?: EmailMenuPlacement
}

export function EmailMenuButton({ email, labels, trigger, className, placement = 'bottom' }: EmailMenuButtonProps) {
  const [open, setOpen] = useState(false)
  const toast = useToast()
  const menuId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const itemsRef = useRef<Array<HTMLElement | null>>([])
  const href = `mailto:${email}`

  const focusItem = useCallback((index: number) => {
    const items = itemsRef.current.filter((item): item is HTMLElement => item !== null)
    if (items.length === 0) return
    items[(index + items.length) % items.length]?.focus()
  }, [])

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    focusItem(0)
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, focusItem])

  const copy = async () => {
    close(true)
    try {
      await navigator.clipboard.writeText(email)
      toast.success(labels.copied)
    } catch {
      toast.error(labels.copyFailed)
    }
  }

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
    }
  }

  const onMenuKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const items = itemsRef.current.filter((item): item is HTMLElement => item !== null)
    const current = items.indexOf(document.activeElement as HTMLElement)
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusItem(current + 1)
        return
      case 'ArrowUp':
        event.preventDefault()
        focusItem(current - 1)
        return
      case 'Home':
        event.preventDefault()
        focusItem(0)
        return
      case 'End':
        event.preventDefault()
        focusItem(items.length - 1)
        return
      case 'Escape':
        event.preventDefault()
        close(true)
        return
      case 'Tab':
        setOpen(false)
        return
    }
  }

  return (
    <span ref={rootRef} className={styles.root} data-cw-email-menu="">
      <a href={href} className={cx(className, styles.fallback)} aria-label={labels.write} data-cw-email-fallback="">
        {trigger}
      </a>
      <button
        ref={triggerRef}
        type="button"
        className={cx(className, styles.trigger)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={labels.menu}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
        data-cw-email-trigger=""
      >
        {trigger}
      </button>
      {open ? (
        <ul
          id={menuId}
          role="menu"
          aria-label={labels.menu}
          className={styles.menu}
          data-cw-glass="strong"
          data-placement={placement}
          onKeyDown={onMenuKeyDown}
          data-cw-email-options=""
        >
          <li role="none">
            <a
              ref={(node) => {
                itemsRef.current[0] = node
              }}
              role="menuitem"
              tabIndex={-1}
              href={href}
              className={styles.item}
              onClick={() => setOpen(false)}
              data-cw-email-write=""
            >
              {labels.write}
            </a>
          </li>
          <li role="none">
            <button
              ref={(node) => {
                itemsRef.current[1] = node
              }}
              role="menuitem"
              tabIndex={-1}
              type="button"
              className={styles.item}
              onClick={() => void copy()}
              data-cw-email-copy=""
            >
              {labels.copy}
            </button>
          </li>
        </ul>
      ) : null}
    </span>
  )
}
