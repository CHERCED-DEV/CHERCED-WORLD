'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { Button, type ButtonVariant } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import type { ActionResult } from '@/lib/actions/result'
import styles from './admin.module.scss'
import { failureText, notCompletedTitle, type ResultLabels } from './results'

type BaseProps = {
  action: () => Promise<ActionResult>
  label: string
  results: ResultLabels
  variant?: ButtonVariant
  name?: string
}

function useRunner(action: () => Promise<ActionResult>, results: ResultLabels, label: string) {
  const [pending, startTransition] = useTransition()
  const toast = useToast()
  const router = useRouter()
  const run = (after?: () => void) =>
    startTransition(async () => {
      const result = await action()
      after?.()
      const message = failureText(result, results)
      if (!message) return
      toast.error(message, notCompletedTitle(results, label))
      if (!result.ok && result.error === 'unauthorized') router.refresh()
    })
  return { pending, run }
}

export function ActionButton({ action, label, results, variant = 'glass', name }: BaseProps) {
  const { pending, run } = useRunner(action, results, label)
  return (
    <Button
      variant={variant}
      size="sm"
      disabled={pending}
      aria-busy={pending || undefined}
      data-cw-action={name}
      onClick={() => run()}
    >
      {label}
    </Button>
  )
}

export type ConfirmLabels = { title: string; text: string; confirm: string; cancel: string }

export function ConfirmButton({ action, label, results, confirm, name }: BaseProps & { confirm: ConfirmLabels }) {
  const { pending, run } = useRunner(action, results, label)
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const textId = useId()
  return (
    <>
      <Button variant="ghost" size="sm" disabled={pending} data-cw-action={name} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} describedBy={textId}>
        <h2 id={titleId} className={styles.dialogTitle}>
          {confirm.title}
        </h2>
        <p id={textId}>{confirm.text}</p>
        <div className={styles.dialogActions}>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {confirm.cancel}
          </Button>
          <Button variant="solid" disabled={pending} data-cw-confirm="" onClick={() => run(() => setOpen(false))}>
            {confirm.confirm}
          </Button>
        </div>
      </Dialog>
    </>
  )
}
