'use client'

import { useEffect, useEffectEvent, useRef, type MouseEvent, type ReactNode } from 'react'
import { cx } from './cx'
import styles from './Dialog.module.scss'

export type DialogProps = {
  open: boolean
  onClose: () => void
  labelledBy: string
  describedBy?: string
  className?: string
  children: ReactNode
}

export function Dialog({ open, onClose, labelledBy, describedBy, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const notifyClose = useEffectEvent(() => onClose())

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handleClose = () => notifyClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  const closeOnBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-cw-glass="strong"
      className={cx(styles.dialog, className)}
      onClick={closeOnBackdrop}
    >
      <div className={styles.body}>{children}</div>
    </dialog>
  )
}
