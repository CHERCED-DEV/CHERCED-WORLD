'use client'

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useToast } from '@/components/ui/Toast'
import { submitContact } from '@/lib/actions/contact'
import type { ActionResult } from '@/lib/actions/result'
import type { Dictionary } from '@/lib/i18n'
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/security/anti-spam'
import { contactSchema, LIMITS, parseForm } from '@/lib/validation'
import { ConsentField, type ConsentLabels } from './ConsentField'
import styles from './ContactForm.module.scss'
import { fieldErrorText, focusFirstInvalid } from './fieldErrors'

export type ContactLabels = {
  formLabel: string
  name: string
  email: string
  phone: string
  phoneHint: string
  message: string
  submit: string
  sending: string
  requiredNote: string
  successTitle: string
  successText: string
  errorTitle: string
  errorText: string
  rateLimited: string
  validation: string
  consentRequired: string
  honeypot: string
  consent: ConsentLabels
}

export type ContactFormProps = {
  renderedAt: number
  privacyHref: string
  labels: ContactLabels
  errors: Dictionary
}

function resultMessage(result: ActionResult, labels: ContactLabels): string {
  if (result.ok) return labels.successText
  if (result.error === 'rate_limited') return labels.rateLimited
  if (result.error === 'consent_required') return labels.consentRequired
  if (result.error === 'validation' && result.fieldErrors) return labels.validation
  return labels.errorText
}

function Required() {
  return <span aria-hidden="true"> *</span>
}

export function ContactForm({ renderedAt, privacyHref, labels, errors }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContact, null)
  const [clientErrors, setClientErrors] = useState<Record<string, string> | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const toast = useToast()

  useEffect(() => {
    if (!state) return
    const form = formRef.current
    if (state.ok) {
      form?.reset()
      toast.success(labels.successText, labels.successTitle)
      return
    }
    toast.error(resultMessage(state, labels), labels.errorTitle)
    if (form && state.fieldErrors) focusFirstInvalid(form, state.fieldErrors)
  }, [state, labels, toast])

  const fieldErrors = clientErrors ?? (state && !state.ok ? state.fieldErrors : undefined) ?? {}
  const errorFor = (field: string) => fieldErrorText(errors, fieldErrors[field], field)

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const parsed = parseForm(contactSchema, data)
    if (!parsed.success) {
      setClientErrors(parsed.fieldErrors)
      focusFirstInvalid(form, parsed.fieldErrors)
      return
    }
    setClientErrors(null)
    startTransition(() => formAction(data))
  }

  const inlineStatus = state ? resultMessage(state, labels) : null

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
      aria-label={labels.formLabel}
      data-cw-contact-form=""
    >
      <p className={styles.note}>{labels.requiredNote}</p>

      <FormField label={<>{labels.name}<Required /></>} error={errorFor('name')}>
        <input name="name" type="text" autoComplete="name" required maxLength={LIMITS.name} />
      </FormField>

      <FormField label={<>{labels.email}<Required /></>} error={errorFor('email')}>
        <input name="email" type="email" inputMode="email" autoComplete="email" required maxLength={LIMITS.email} />
      </FormField>

      <FormField label={labels.phone} hint={labels.phoneHint} error={errorFor('phone')}>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} />
      </FormField>

      <FormField label={<>{labels.message}<Required /></>} error={errorFor('message')}>
        <textarea name="message" required rows={6} maxLength={LIMITS.message} />
      </FormField>

      <ConsentField labels={labels.consent} href={privacyHref} error={errorFor('consent')} />

      <div className={styles.trap} aria-hidden="true">
        <label>
          {labels.honeypot}
          <input name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name={RENDERED_AT_FIELD} value={String(renderedAt)} />

      <div className={styles.actions}>
        <Button type="submit" variant="solid" size="lg" disabled={pending} aria-disabled={pending}>
          {pending ? labels.sending : labels.submit}
        </Button>
      </div>

      {inlineStatus ? (
        <p role="status" className={styles.noJsStatus} data-cw-contact-status={state?.ok ? 'ok' : 'error'}>
          {inlineStatus}
        </p>
      ) : null}
    </form>
  )
}
