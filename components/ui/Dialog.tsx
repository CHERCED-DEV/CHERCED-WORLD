'use client'

import { useEffect, useEffectEvent, useRef, type MouseEvent, type ReactNode } from 'react'
import { SHEET_DRAG_VAR, attachSheetDrag } from '@/lib/fx/sheet'
import { cx } from './cx'
import styles from './Dialog.module.scss'

export const MOBILE_SHEET_QUERY = '(max-width: 767.98px)'

const SHEET_CLOSE_FALLBACK_MS = 420

export type DialogProps = {
  open: boolean
  onClose: () => void
  labelledBy: string
  describedBy?: string
  className?: string
  mobileSheet?: boolean
  children: ReactNode
}

export function Dialog({ open, onClose, labelledBy, describedBy, className, mobileSheet = false, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const gripRef = useRef<HTMLDivElement>(null)
  const notifyClose = useEffectEvent(() => onClose())

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.removeAttribute('data-state')
      dialog.style.removeProperty(SHEET_DRAG_VAR)
      dialog.showModal()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => notifyClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  useEffect(() => {
    const dialog = ref.current
    const grip = gripRef.current
    if (!mobileSheet || !dialog || !grip) return
    let timer = 0
    const dismiss = () => {
      const close = () => {
        window.clearTimeout(timer)
        dialog.removeEventListener('transitionend', close)
        if (dialog.open) dialog.close()
      }
      dialog.setAttribute('data-state', 'closing')
      dialog.addEventListener('transitionend', close)
      timer = window.setTimeout(close, SHEET_CLOSE_FALLBACK_MS)
    }
    const query = window.matchMedia(MOBILE_SHEET_QUERY)
    let detach: (() => void) | null = null
    const sync = () => {
      detach?.()
      detach = query.matches ? attachSheetDrag(grip, dialog, dismiss) : null
    }
    sync()
    query.addEventListener('change', sync)
    return () => {
      window.clearTimeout(timer)
      query.removeEventListener('change', sync)
      detach?.()
    }
  }, [mobileSheet])

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-cw-glass="strong"
      data-cw-sheet={mobileSheet ? '' : undefined}
      className={cx(styles.dialog, mobileSheet && styles.sheet, className)}
      onClick={closeOnBackdrop}
    >
      {mobileSheet ? <div ref={gripRef} className={styles.grip} aria-hidden="true" data-cw-sheet-drag="" /> : null}
      <div className={styles.body}>{children}</div>
    </dialog>
  )
}
