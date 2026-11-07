'use client'

import { useState, type MouseEvent, type ReactNode } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { Dialog } from '@/components/ui/Dialog'
import styles from './Recruiters.module.scss'

export type RecruitersDialogProps = {
  label: string
  closeLabel: string
  labelledBy: string
  children: ReactNode
  className?: string
}

export function RecruitersDialog({ label, closeLabel, labelledBy, children, className }: RecruitersDialogProps) {
  const [open, setOpen] = useState(false)

  const followLinks = (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as HTMLElement).closest('a')
    if (!link) return
    const href = link.getAttribute('href') ?? ''
    setOpen(false)
    if (!href.startsWith('#')) return
    event.preventDefault()
    window.setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ block: 'start' })
      window.history.replaceState(null, '', href)
    }, 0)
  }

  return (
    <>
      <button
        type="button"
        className={cx(styles.trigger, 'cw-js-only', className)}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        data-cw-recruiters-open=""
      >
        <span className={styles.triggerDot} aria-hidden="true" />
        {label}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={labelledBy} className={styles.dialog} mobileSheet>
        <div onClick={followLinks}>{children}</div>
        <div className={styles.dialogClose}>
          <button type="button" className={buttonClassName({ variant: 'ghost' })} onClick={() => setOpen(false)} data-cw-recruiters-close="">
            {closeLabel}
          </button>
        </div>
      </Dialog>
    </>
  )
}
