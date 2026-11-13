'use client'

import { startTransition, useActionState, useEffect, useEffectEvent, useId, useRef, useState, type FormEvent } from 'react'
import { usePathname } from 'next/navigation'
import { useAccountSummary } from '@/components/account/useAccountSummary'
import { ConsentField, type ConsentLabels } from '@/components/contact/ConsentField'
import { accountCopy } from '@/content/account'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/lib/i18n'
import { accountCommentSchema, commentSchema, LIMITS, parseForm } from '@/lib/validation'
import type { CommentFormLabels } from '../labels'
import styles from './Comments.module.scss'
import { fieldErrorText, firstInvalidField, serverFieldErrors, statusOf, type CommentAction } from './state'

export type CommentFormProps = {
  action: CommentAction
  postId: string
  lang: Locale
  privacyHref: string
  renderedAt: number | null
  labels: CommentFormLabels
  consent?: ConsentLabels
  onSuccess?: () => void
  onClose?: () => void
}

export function consentFromCommentLabels(labels: CommentFormLabels): ConsentLabels {
  return { text: `${labels.consentBefore}${labels.consentAfter}`.trim(), readPolicy: labels.consentLink, newTab: '' }
}

export function CommentForm({ action, postId, lang, privacyHref, renderedAt, labels, consent, onSuccess, onClose }: CommentFormProps) {
  const [result, dispatch, pending] = useActionState(action, null)
  const [clientErrors, setClientErrors] = useState<Record<string, string> | null>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const formId = useId()
  const account = useAccountSummary()
  const pathname = usePathname()
  const status = statusOf(result)
  const errors = pending ? {} : (clientErrors ?? serverFieldErrors(result))
  const hasErrors = Object.keys(errors).length > 0

  const notifySuccess = useEffectEvent(() => onSuccess?.())

  useEffect(() => {
    if (status !== 'success') return
    successRef.current?.focus()
    notifySuccess()
  }, [status])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const parsed = account.signedIn ? parseForm(accountCommentSchema, formData) : parseForm(commentSchema, formData)
    if (!parsed.success) {
      setClientErrors(parsed.fieldErrors)
      const field = firstInvalidField(parsed.fieldErrors)
      if (field) form.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
      return
    }
    setClientErrors(null)
    startTransition(() => dispatch(formData))
  }

  if (status === 'success') {
    return (
      <div ref={successRef} tabIndex={-1} role="status" className={styles.success} data-cw-comment-status="success">
        <Icon name="check" size={28} />
        <p className={styles.successTitle}>{labels.pending}</p>
        <p>{labels.pendingNote}</p>
        <Button variant="solid" onClick={onClose}>
          {labels.close}
        </Button>
      </div>
    )
  }

  const alert = pending
    ? null
    : hasErrors
      ? labels.errors.validation
      : status === 'unavailable'
        ? labels.errors.unavailable
        : status === 'rate_limited'
          ? labels.errors.rateLimited
          : status === 'error'
            ? labels.errors.generic
            : null

  const error = (field: string) => fieldErrorText(labels.fieldErrors, field, errors[field])

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={pending} data-cw-comment-form="">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="renderedAt" value={renderedAt === null ? '' : String(renderedAt)} />
      <div className={styles.trap} aria-hidden="true">
        <label htmlFor={`${formId}-website`}>{labels.website}</label>
        <input id={`${formId}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      {account.signedIn ? (
        <>
          <input type="hidden" name="account" value="1" />
          <p className={styles.accountNote} data-cw-comment-account="">
            {accountCopy[lang].commentAs.replace('{name}', account.name)}
          </p>
        </>
      ) : (
        <>
          <p className={styles.accountNote}>
            <a href={`/${lang}/account?next=${encodeURIComponent(pathname ?? `/${lang}/blog`)}`} data-cw-comment-signin="">
              {accountCopy[lang].commentSignIn}
            </a>
          </p>
          <FormField label={labels.name} error={error('userName')}>
            <input name="userName" type="text" autoComplete="name" maxLength={LIMITS.name} required />
          </FormField>
          <FormField label={labels.email} error={error('email')}>
            <input name="email" type="email" autoComplete="email" maxLength={LIMITS.email} required />
          </FormField>
        </>
      )}
      <FormField label={labels.comment} hint={labels.commentHint} error={error('comment')}>
        <textarea name="comment" maxLength={LIMITS.comment} rows={5} required />
      </FormField>
      <ConsentField labels={consent ?? consentFromCommentLabels(labels)} href={privacyHref} error={error('consent')} />

      <div className={styles.alertSlot}>
        {alert ? (
          <p role="alert" className={styles.alert} data-cw-comment-status={hasErrors ? 'validation' : status}>
            <Icon name="alert" size={18} />
            <span>{alert}</span>
          </p>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onClose}>
          {labels.close}
        </Button>
        <Button type="submit" variant="solid" disabled={pending}>
          {pending ? labels.sending : labels.submit}
        </Button>
      </div>
    </form>
  )
}
