'use client'

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useToast } from '@/components/ui/Toast'
import { saveTeamGrant } from '@/lib/actions/account'
import type { Permission } from '@/lib/data/types'
import styles from './admin.module.scss'

export type GrantFormLabels = {
  title: string
  email: string
  emailError: string
  permissions: string
  options: Record<Permission, string>
  save: string
  saved: string
  failed: string
}

export function GrantForm({ labels, email = '', permissions = [] }: { labels: GrantFormLabels; email?: string; permissions?: Permission[] }) {
  const [state, formAction, pending] = useActionState(saveTeamGrant, null)
  const formRef = useRef<HTMLFormElement>(null)
  const toast = useToast()
  const emailError = state && !state.ok && state.fieldErrors?.email ? labels.emailError : undefined

  useEffect(() => {
    if (!state) return
    if (state.ok) {
      formRef.current?.reset()
      toast.success(labels.saved)
    } else if (!state.fieldErrors) toast.error(labels.failed)
  }, [state, toast, labels.saved, labels.failed])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => formAction(data))
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className={styles.card} data-cw-glass="subtle" data-cw-grant-form="" id="grant">
      <h3 className={styles.cardTitle}>{labels.title}</h3>
      <FormField label={labels.email} error={emailError}>
        <input name="email" type="email" autoComplete="off" required maxLength={254} defaultValue={email} />
      </FormField>
      <fieldset className={styles.permissions}>
        <legend>{labels.permissions}</legend>
        {(Object.keys(labels.options) as Permission[]).map((permission) => (
          <label key={permission} className={styles.permission}>
            <input type="checkbox" name="permissions" value={permission} defaultChecked={permissions.includes(permission)} />
            <span>{labels.options[permission]}</span>
          </label>
        ))}
      </fieldset>
      <Button type="submit" variant="solid" disabled={pending}>
        {labels.save}
      </Button>
    </form>
  )
}
