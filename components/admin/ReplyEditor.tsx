'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, type FormEvent } from 'react'
import { fieldErrorText } from '@/components/contact/fieldErrors'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useToast } from '@/components/ui/Toast'
import type { ActionResult } from '@/lib/actions/result'
import type { Dictionary } from '@/lib/i18n'
import { LIMITS, parseInput, replySchema } from '@/lib/validation'
import styles from './admin.module.scss'
import { failureText, notCompletedTitle, type ResultLabels } from './results'

export type ReplyLabels = { label: string; reply: string; save: string; edit: string; remove: string; cancel: string }

export type ReplyEditorProps = {
  save: (text: string | null) => Promise<ActionResult>
  current: string | null
  labels: ReplyLabels
  results: ResultLabels
  errors: Dictionary
}

export function ReplyEditor({ save, current, labels, results, errors }: ReplyEditorProps) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [pending, startTransition] = useTransition()
  const toast = useToast()
  const router = useRouter()

  const send = (text: string | null) =>
    startTransition(async () => {
      const actionLabel = text === null ? labels.remove : labels.save
      const result = await save(text)
      if (result.ok) {
        setEditing(false)
        setError(undefined)
        return
      }
      const fieldKey = result.fieldErrors?.text
      setError(fieldErrorText(errors, fieldKey, 'text'))
      toast.error(failureText(result, results) ?? results.unavailable, notCompletedTitle(results, actionLabel))
      if (result.error === 'unauthorized') router.refresh()
    })

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = String(new FormData(event.currentTarget).get('text') ?? '')
    const parsed = parseInput(replySchema, { text })
    if (!parsed.success) {
      setError(fieldErrorText(errors, parsed.fieldErrors.text, 'text'))
      return
    }
    send(parsed.data.text)
  }

  if (!editing && current) {
    return (
      <div className={styles.reply} data-cw-author-reply="">
        <p className={styles.replyLabel}>{labels.label}</p>
        <p className={styles.body}>{current}</p>
        <div className={styles.actions}>
          <Button size="sm" variant="glass" onClick={() => setEditing(true)} disabled={pending}>
            {labels.edit}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => send(null)} disabled={pending} data-cw-action="reply-delete">
            {labels.remove}
          </Button>
        </div>
      </div>
    )
  }

  if (!editing) {
    return (
      <div className={styles.actions}>
        <Button size="sm" variant="glass" onClick={() => setEditing(true)} data-cw-action="reply">
          {labels.reply}
        </Button>
      </div>
    )
  }

  return (
    <form className={styles.reply} onSubmit={onSubmit} noValidate>
      <FormField label={labels.label} error={error}>
        <textarea name="text" rows={3} maxLength={LIMITS.reply} defaultValue={current ?? ''} required />
      </FormField>
      <div className={styles.actions}>
        <Button type="submit" size="sm" variant="solid" disabled={pending} data-cw-action="reply-save">
          {labels.save}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  )
}
