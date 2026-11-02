import 'server-only'
import { t, type Dictionary } from '@/lib/i18n'
import type { ConsentLabels } from './ConsentField'
import type { ContactLabels } from './ContactForm'
import { FALLBACK_ERROR, FORM_ERROR_KEYS } from './fieldErrors'

const CONSENT_MARKER = '{privacyPolicy}'

export function consentLabels(common: Dictionary, newTab: string): ConsentLabels {
  const template = t(common, 'privacy.consent')
  const index = template.indexOf(CONSENT_MARKER)
  const before = index === -1 ? `${template} ` : template.slice(0, index)
  const after = index === -1 ? '' : template.slice(index + CONSENT_MARKER.length)
  return { before, link: t(common, 'privacy.policyLink'), after, newTab }
}

export function formErrorMessages(common: Dictionary, extra: Record<string, string> = {}): Dictionary {
  const messages: Record<string, string> = { ...extra }
  for (const key of FORM_ERROR_KEYS) messages[key] = t(common, key)
  messages[FALLBACK_ERROR] ??= t(common, 'form.required')
  return messages
}

export function contactLabels(common: Dictionary, contact: Dictionary): ContactLabels {
  return {
    formLabel: t(contact, 'contact.formLabel'),
    name: t(contact, 'contact.name'),
    email: t(contact, 'contact.email'),
    phone: t(contact, 'contact.phone'),
    phoneHint: t(contact, 'contact.phoneHint'),
    message: t(contact, 'contact.message'),
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
    consent: consentLabels(common, t(contact, 'contact.newTab')),
  }
}
