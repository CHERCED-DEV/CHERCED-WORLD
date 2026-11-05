import 'server-only'
import { t, type Dictionary } from '@/lib/i18n'
import { INTEREST_ERROR, MESSAGE_INTERESTS } from '@/lib/validation'
import type { ConsentLabels } from './ConsentField'
import type { ContactLabels, InterestLabels } from './ContactForm'
import { FALLBACK_ERROR, FORM_ERROR_KEYS } from './fieldErrors'

export function consentLabels(common: Dictionary, newTab: string): ConsentLabels {
  return { text: t(common, 'privacy.consent'), readPolicy: t(common, 'privacy.readPolicy'), newTab }
}

export function formErrorMessages(common: Dictionary, extra: Record<string, string> = {}): Dictionary {
  const messages: Record<string, string> = { ...extra }
  for (const key of FORM_ERROR_KEYS) messages[key] = t(common, key)
  messages[FALLBACK_ERROR] ??= t(common, 'form.required')
  return messages
}

export function contactErrorMessages(common: Dictionary, contact: Dictionary): Dictionary {
  return formErrorMessages(common, { [INTEREST_ERROR]: t(contact, 'contact.validation') })
}

export function interestLabels(contact: Dictionary): InterestLabels {
  return {
    label: t(contact, 'contact.interest'),
    none: t(contact, 'contact.interest.none'),
    options: MESSAGE_INTERESTS.map((value) => ({ value, label: t(contact, `contact.interest.${value}`) })),
  }
}

export function contactLabels(common: Dictionary, contact: Dictionary): ContactLabels {
  return {
    formLabel: t(contact, 'contact.formLabel'),
    name: t(contact, 'contact.name'),
    email: t(contact, 'contact.email'),
    phone: t(contact, 'contact.phone'),
    phoneHint: t(contact, 'contact.phoneHint'),
    message: t(contact, 'contact.message'),
    interest: interestLabels(contact),
    submit: t(contact, 'contact.submit'),
    sending: t(contact, 'contact.sending'),
    requiredNote: t(contact, 'contact.requiredNote'),
    successTitle: t(contact, 'contact.success.title'),
    successText: t(contact, 'contact.success.text'),
    errorTitle: t(contact, 'contact.error.title'),
    errorText: t(contact, 'contact.error.text'),
    rateLimited: t(contact, 'contact.rateLimited'),
    validation: t(contact, 'contact.validation'),
    consentRequired: t(common, 'privacy.required'),
    honeypot: t(contact, 'contact.honeypot'),
    newTab: t(contact, 'contact.newTab'),
    consent: consentLabels(common, t(contact, 'contact.newTab')),
  }
}
