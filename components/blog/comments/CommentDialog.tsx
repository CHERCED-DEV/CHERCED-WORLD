'use client'

import { useCallback, useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import type { Locale } from '@/lib/i18n'
import type { CommentFormLabels } from '../labels'
import { CommentForm } from './CommentForm'
import styles from './Comments.module.scss'
import type { CommentAction } from './state'

export type CommentDialogProps = {
  action: CommentAction
  postId: string
  lang: Locale
  privacyHref: string
  labels: CommentFormLabels
}

export function CommentDialog({ action, postId, lang, privacyHref, labels }: CommentDialogProps) {
  const titleId = useId()
  const [open, setOpen] = useState(false)
  const [renderedAt, setRenderedAt] = useState<number | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [done, setDone] = useState(false)

  function openDialog() {
    setRenderedAt((current) => current ?? Date.now())
    setOpen(true)
  }

  function handleClose() {
    setOpen(false)
    if (!done) return
    setDone(false)
    setRenderedAt(null)
    setFormKey((key) => key + 1)
  }

  const markDone = useCallback(() => setDone(true), [])
  const requestClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <Button
        variant="solid"
        className="cw-js-only"
        aria-haspopup="dialog"
        onClick={openDialog}
        data-cw-comment-open=""
      >
        {labels.title}
      </Button>
      <Dialog open={open} onClose={handleClose} labelledBy={titleId} className={styles.dialog}>
        <h2 id={titleId} className={styles.dialogTitle}>
          {labels.title}
        </h2>
        <CommentForm
          key={formKey}
          action={action}
          postId={postId}
          lang={lang}
          privacyHref={privacyHref}
          renderedAt={renderedAt}
          labels={labels}
          onSuccess={markDone}
          onClose={requestClose}
        />
      </Dialog>
    </>
  )
}
