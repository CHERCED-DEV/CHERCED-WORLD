'use client'

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from 'react'
import { fieldErrorText } from '@/components/contact/fieldErrors'
import { useHydrated } from '@/components/contact/useHydrated'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { changePassword, completeSetup, login, logout } from '@/lib/actions/auth'
import type { ActionResult } from '@/lib/actions/result'
import type { Dictionary, Locale } from '@/lib/i18n'
import { LIMITS } from '@/lib/validation'
import styles from './admin.module.scss'

type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>

function useKeepValuesAction(action: FormAction) {
  const [state, formAction, pending] = useActionState(action, null)
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => formAction(data))
  }
  return { state, formAction, pending, onSubmit }
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className={styles.formError} data-cw-form-error="">
      <Icon name="alert" size={18} />
      <span>{message}</span>
    </p>
  )
}

export type LoginLabels = {
  title: string
  password: string
  submit: string
  error: string
  locked: string
  unavailable: string
}

export function LoginForm({ lang, labels, errors }: { lang: Locale; labels: LoginLabels; errors: Dictionary }) {
  const [state, formAction, pending] = useActionState(login, null)
  const hydrated = useHydrated()
  const failure = state && !state.ok ? state : null
  const message = !failure
    ? null
    : failure.error === 'rate_limited'
      ? labels.locked
      : failure.error === 'unauthorized'
        ? labels.error
        : failure.error === 'unavailable'
          ? labels.unavailable
          : null

  return (
    <form action={formAction} className={styles.authCard} data-cw-glass="standard" data-cw-login="" data-cw-hydrated={hydrated ? '' : undefined}>
      <h1 className={styles.authTitle}>{labels.title}</h1>
      <input type="hidden" name="lang" value={lang} />
      <FormField label={labels.password} error={fieldErrorText(errors, failure?.fieldErrors?.password, 'password')}>
        <input name="password" type="password" autoComplete="current-password" required maxLength={LIMITS.passwordMax} />
      </FormField>
      <FormError message={message} />
      <Button type="submit" variant="solid" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  )
}

export type SetupLabels = {
  title: string
  intro: string
  code: string
  codeHint: string
  password: string
  passwordHint: string
  confirm: string
  submit: string
  locked: string
  unavailable: string
  setupGone: string
}

export function SetupForm({ lang, labels, errors }: { lang: Locale; labels: SetupLabels; errors: Dictionary }) {
  const { state, formAction, pending, onSubmit } = useKeepValuesAction(completeSetup)
  const hydrated = useHydrated()
  const failure = state && !state.ok ? state : null
  const message = !failure
    ? null
    : failure.error === 'rate_limited'
      ? labels.locked
      : failure.error === 'not_found'
        ? labels.setupGone
        : failure.error === 'unavailable'
          ? labels.unavailable
          : null
  const errorFor = (field: string) => fieldErrorText(errors, failure?.fieldErrors?.[field], field)

  return (
    <form
      action={formAction}
      onSubmit={onSubmit}
      className={styles.authCard}
      data-cw-glass="standard"
      data-cw-setup=""
      data-cw-hydrated={hydrated ? '' : undefined}
    >
      <h1 className={styles.authTitle}>{labels.title}</h1>
      <p className={styles.muted}>{labels.intro}</p>
      <input type="hidden" name="lang" value={lang} />
      <FormField label={labels.code} hint={labels.codeHint} error={errorFor('code')}>
        <input name="code" type="text" autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} required maxLength={16} />
      </FormField>
      <FormField label={labels.password} hint={labels.passwordHint} error={errorFor('password')}>
        <input name="password" type="password" autoComplete="new-password" required minLength={LIMITS.passwordMin} maxLength={LIMITS.passwordMax} />
      </FormField>
      <FormField label={labels.confirm} error={errorFor('confirm')}>
        <input name="confirm" type="password" autoComplete="new-password" required maxLength={LIMITS.passwordMax} />
      </FormField>
      <FormError message={message} />
      <Button type="submit" variant="solid" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  )
}

export type ChangePasswordLabels = {
  title: string
  current: string
  password: string
  passwordHint: string
  confirm: string
  submit: string
  changed: string
  locked: string
  unavailable: string
  unauthorized: string
}

export function ChangePasswordForm({ labels, errors }: { labels: ChangePasswordLabels; errors: Dictionary }) {
  const { state, formAction, pending, onSubmit } = useKeepValuesAction(changePassword)
  const formRef = useRef<HTMLFormElement>(null)
  const toast = useToast()
  const failure = state && !state.ok ? state : null
  const message = !failure
    ? null
    : failure.error === 'rate_limited'
      ? labels.locked
      : failure.error === 'unauthorized'
        ? labels.unauthorized
        : failure.error === 'unavailable'
          ? labels.unavailable
          : null
  const errorFor = (field: string) => fieldErrorText(errors, failure?.fieldErrors?.[field], field)

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset()
      toast.success(labels.changed)
    }
  }, [state, toast, labels.changed])

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit} className={styles.card} data-cw-glass="subtle" data-cw-change-password="">
      <h2 className={styles.cardTitle}>{labels.title}</h2>
      <FormField label={labels.current} error={errorFor('current')}>
        <input name="current" type="password" autoComplete="current-password" required maxLength={LIMITS.passwordMax} />
      </FormField>
      <FormField label={labels.password} hint={labels.passwordHint} error={errorFor('password')}>
        <input name="password" type="password" autoComplete="new-password" required minLength={LIMITS.passwordMin} maxLength={LIMITS.passwordMax} />
      </FormField>
      <FormField label={labels.confirm} error={errorFor('confirm')}>
        <input name="confirm" type="password" autoComplete="new-password" required maxLength={LIMITS.passwordMax} />
      </FormField>
      <FormError message={message} />
      {state?.ok ? (
        <p role="status" className={styles.muted}>
          {labels.changed}
        </p>
      ) : null}
      <Button type="submit" variant="solid" disabled={pending}>
        {labels.submit}
      </Button>
    </form>
  )
}

export function LogoutButton({ lang, label }: { lang: Locale; label: string }) {
  const [, formAction, pending] = useActionState(logout, null)
  return (
    <form action={formAction}>
      <input type="hidden" name="lang" value={lang} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending} data-cw-logout="">
        {label}
      </Button>
    </form>
  )
}
