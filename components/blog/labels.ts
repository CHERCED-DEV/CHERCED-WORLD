import { t, type Dictionary } from '@/lib/i18n/translate'
import { ERROR_KEYS, LIMITS } from '@/lib/validation'
import type { CopyLabels } from './CopyButton'
import type { GlassDemoLabels } from './mdx/GlassDemo'
import type { PostLabels } from './mdx/prepare'

export function codeLabels(blog: Dictionary): CopyLabels {
  return { copy: t(blog, 'code.copy'), copied: t(blog, 'code.copied'), copyError: t(blog, 'code.copyError') }
}

export function shareCopyLabels(blog: Dictionary): CopyLabels {
  return { copy: t(blog, 'share.copy'), copied: t(blog, 'share.copied'), copyError: t(blog, 'share.copyError') }
}

export function glassDemoLabels(blog: Dictionary): GlassDemoLabels {
  return {
    title: t(blog, 'glassDemo.title'),
    legend: t(blog, 'glassDemo.legend'),
    subtle: t(blog, 'glassDemo.subtle'),
    standard: t(blog, 'glassDemo.standard'),
    strong: t(blog, 'glassDemo.strong'),
    motion: t(blog, 'glassDemo.motion'),
    sample: t(blog, 'glassDemo.sample'),
  }
}

export function postLabels(blog: Dictionary): PostLabels {
  return { code: codeLabels(blog), glassDemo: glassDemoLabels(blog) }
}

export type CommentFormLabels = {
  title: string
  name: string
  email: string
  comment: string
  commentHint: string
  submit: string
  sending: string
  close: string
  website: string
  consentBefore: string
  consentLink: string
  consentAfter: string
  pending: string
  pendingNote: string
  errors: {
    validation: string
    unavailable: string
    rateLimited: string
    generic: string
  }
  fieldErrors: Record<string, string>
}

const FIELD_LIMITS: Record<string, number> = {
  userName: LIMITS.name,
  email: LIMITS.email,
  comment: LIMITS.comment,
}

const PRIVACY_TOKEN = '{privacyPolicy}'

export function splitConsent(template: string): { before: string; after: string } {
  const index = template.indexOf(PRIVACY_TOKEN)
  if (index === -1) return { before: `${template} `, after: '' }
  return { before: template.slice(0, index), after: template.slice(index + PRIVACY_TOKEN.length) }
}

const COMMENT_ERROR_KEYS = [ERROR_KEYS.required, ERROR_KEYS.email, ERROR_KEYS.consent] as const

export function fieldErrorMessages(common: Dictionary): Record<string, string> {
  const messages: Record<string, string> = Object.fromEntries(COMMENT_ERROR_KEYS.map((key) => [key, t(common, key)]))
  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    messages[`${field}:${ERROR_KEYS.tooLong}`] = t(common, ERROR_KEYS.tooLong, { max })
  }
  return messages
}

export function commentFormLabels(blog: Dictionary, common: Dictionary): CommentFormLabels {
  const consent = splitConsent(t(common, 'privacy.consent'))
  return {
    title: t(blog, 'comments.form.title'),
    name: t(blog, 'comments.form.name'),
    email: t(blog, 'comments.form.email'),
    comment: t(blog, 'comments.form.comment'),
    commentHint: t(blog, 'comments.form.commentHint', { max: LIMITS.comment }),
    submit: t(blog, 'comments.form.submit'),
    sending: t(blog, 'comments.form.sending'),
    close: t(common, 'dialog.close'),
    website: t(blog, 'comments.form.website'),
    consentBefore: consent.before,
    consentLink: t(common, 'privacy.policyLink'),
    consentAfter: consent.after,
    pending: t(blog, 'comments.pending'),
    pendingNote: t(blog, 'comments.pendingNote'),
    errors: {
      validation: t(blog, 'comments.error.validation'),
      unavailable: t(blog, 'comments.error.unavailable'),
      rateLimited: t(blog, 'comments.error.rateLimited'),
      generic: t(blog, 'comments.error.generic'),
    },
    fieldErrors: fieldErrorMessages(common),
  }
}
