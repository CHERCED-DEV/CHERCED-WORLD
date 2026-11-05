'use client'

import { startTransition, useActionState, useEffect, useRef, useState, type FocusEvent, type FormEvent, type RefObject } from 'react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { useToast } from '@/components/ui/Toast'
import { VisuallyHidden } from '@/components/ui/VisuallyHidden'
import { useKeyboardInset, useMediaQuery } from '@/lib/fx/viewport'
import { submitContact } from '@/lib/actions/contact'
import type { ActionResult } from '@/lib/actions/result'
import type { MessageInterest } from '@/lib/data/types'
import type { Dictionary } from '@/lib/i18n'
import { HONEYPOT_FIELD, RENDERED_AT_FIELD } from '@/lib/security/anti-spam'
import { contactSchema, LIMITS, parseForm } from '@/lib/validation'
import type { BookingLink } from './booking'
import { ConsentField, type ConsentLabels } from './ConsentField'
import styles from './ContactForm.module.scss'
import { fieldErrorText, focusFirstInvalid, PHONE_INPUT_PATTERN } from './fieldErrors'
import { COMPACT_QUERY, keyboardScroll, stickyHeaderBottom } from './keyboard'
import { useHydrated } from './useHydrated'

const LIT_FIELDS = new Set(['name', 'email', 'phone', 'interest', 'message'])

function useKeepAboveKeyboard(form: RefObject<HTMLFormElement | null>, active: string | null, inset: number) {
  useEffect(() => {
    const element = form.current
    const viewport = window.visualViewport
    if (!element || !active || inset <= 0 || !viewport) return
    const field = element.querySelector<HTMLElement>(`[name="${active}"]`)
    if (!field) return
    const action = element.querySelector<HTMLElement>('[data-cw-contact-submit]')
    const span = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect()
      return { top: rect.top, bottom: rect.bottom }
    }
    const delta = keyboardScroll({
      field: span(field),
      action: action ? span(action) : null,
      visibleTop: Math.max(viewport.offsetTop, stickyHeaderBottom(document.getElementById('header'))),
      visibleBottom: viewport.offsetTop + viewport.height,
    })
    if (delta === 0) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollBy({ top: delta, behavior: smooth ? 'smooth' : 'instant' })
  }, [form, active, inset])
}

export type InterestLabels = { label: string; none: string; options: { value: MessageInterest; label: string }[] }

export type ContactLabels = {
  formLabel: string
  name: string
  email: string
  phone: string
  phoneHint: string
  message: string
  interest: InterestLabels
  newTab: string
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
  interest?: MessageInterest | null
  booking?: BookingLink | null
}

export function BookingSlot({ booking, newTab }: { booking: BookingLink | null | undefined; newTab: string }) {
  if (!booking) return null
  return (
    <p className={styles.booking} data-cw-contact-booking="">
      <a href={booking.href} target="_blank" rel="noopener noreferrer">
        {booking.label}
        <VisuallyHidden> {newTab}</VisuallyHidden>
      </a>
    </p>
  )
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

export function ContactForm({ renderedAt, privacyHref, labels, errors, interest = null, booking = null }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(submitContact, null)
  const [clientErrors, setClientErrors] = useState<Record<string, string> | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const toast = useToast()
  const hydrated = useHydrated()
  const compact = useMediaQuery(COMPACT_QUERY)
  const keyboard = useKeyboardInset()
  useKeepAboveKeyboard(formRef, compact ? active : null, keyboard)

  const onFocus = (event: FocusEvent<HTMLFormElement>) => {
    const target: unknown = event.target
    const name = target instanceof HTMLElement ? (target.getAttribute('name') ?? '') : ''
    setActive(LIT_FIELDS.has(name) ? name : null)
  }

  const onBlur = (event: FocusEvent<HTMLFormElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setActive(null)
  }

  const lit = (name: string) =>
    compact ? { 'data-cw-light': '', 'data-cw-blur': active === name ? '' : undefined } : {}

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
      onFocus={onFocus}
      onBlur={onBlur}
      noValidate={hydrated}
      aria-label={labels.formLabel}
      data-cw-contact-form=""
      data-cw-keyboard={compact && keyboard > 0 ? 'open' : undefined}
    >
      <p className={styles.note}>{labels.requiredNote}</p>

      <FormField floating label={<>{labels.name}<Required /></>} error={errorFor('name')}>
        <input name="name" type="text" autoComplete="name" required maxLength={LIMITS.name} {...lit('name')} />
      </FormField>

      <FormField floating label={<>{labels.email}<Required /></>} error={errorFor('email')}>
        <input name="email" type="email" inputMode="email" autoComplete="email" required maxLength={LIMITS.email} {...lit('email')} />
      </FormField>

      <FormField floating label={labels.phone} hint={labels.phoneHint} error={errorFor('phone')}>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} pattern={PHONE_INPUT_PATTERN} {...lit('phone')} />
      </FormField>

      <FormField floating label={labels.interest.label} error={errorFor('interest')}>
        <select name="interest" defaultValue={interest ?? ''} data-cw-interest="" {...lit('interest')}>
          <option value="">{labels.interest.none}</option>
          {labels.interest.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField floating label={<>{labels.message}<Required /></>} error={errorFor('message')}>
        <textarea name="message" required rows={6} maxLength={LIMITS.message} {...lit('message')} />
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
        <Button type="submit" variant="solid" size="lg" disabled={pending} aria-disabled={pending} data-cw-contact-submit="">
          {pending ? labels.sending : labels.submit}
        </Button>
      </div>

      {inlineStatus ? (
        <p role="status" className={styles.noJsStatus} data-cw-contact-status={state?.ok ? 'ok' : 'error'}>
          {inlineStatus}
        </p>
      ) : null}

      {state?.ok ? <BookingSlot booking={booking} newTab={labels.newTab} /> : null}
    </form>
  )
}
