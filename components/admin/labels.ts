import 'server-only'
import { formErrorMessages } from '@/components/contact/labels'
import { t, type Dictionary, type Locale } from '@/lib/i18n'
import { getDictionary } from '@/lib/i18n/server'
import type { ChangePasswordLabels, LoginLabels, SetupLabels } from './AuthForms'
import type { ConfirmLabels } from './ActionButton'
import type { ReplyLabels } from './ReplyEditor'
import type { ResultLabels } from './results'
import type { UpdatesLabels } from './Updates'

export type AdminText = {
  lang: Locale
  admin: Dictionary
  common: Dictionary
  tr: (key: string, vars?: Record<string, string | number>) => string
}

export async function adminText(lang: Locale): Promise<AdminText> {
  const [admin, common] = await Promise.all([getDictionary(lang, 'admin'), getDictionary(lang, 'common')])
  return { lang, admin, common, tr: (key, vars) => t(admin, key, vars) }
}

export function adminErrors(text: AdminText): Dictionary {
  return formErrorMessages(text.common, { 'admin.password.currentWrong': text.tr('admin.password.currentWrong') })
}

export function resultLabels({ tr }: AdminText): ResultLabels {
  return {
    unauthorized: tr('admin.sessionEnded'),
    notFound: tr('admin.error.notFound'),
    validation: tr('admin.error.validation'),
    unavailable: tr('admin.error.unavailable'),
    rateLimited: tr('admin.login.locked'),
    notCompleted: tr('admin.notCompleted'),
  }
}

export function confirmLabels({ tr }: AdminText, kind: 'message' | 'comment'): ConfirmLabels {
  return {
    title: tr(kind === 'message' ? 'admin.delete.message.title' : 'admin.delete.comment.title'),
    text: tr('admin.delete.text'),
    confirm: tr('admin.action.delete'),
    cancel: tr('admin.action.cancel'),
  }
}

export function replyLabels({ tr }: AdminText): ReplyLabels {
  return {
    label: tr('admin.authorReply.label'),
    reply: tr('admin.authorReply'),
    save: tr('admin.authorReply.save'),
    edit: tr('admin.authorReply.edit'),
    remove: tr('admin.authorReply.delete'),
    cancel: tr('admin.action.cancel'),
  }
}

export function updatesLabels({ tr }: AdminText): UpdatesLabels {
  return {
    live: tr('admin.live'),
    reconnecting: tr('admin.connectionLost'),
    newActivity: tr('admin.newActivity'),
    ended: tr('admin.sessionEnded'),
  }
}

export function loginLabels({ tr }: AdminText): LoginLabels {
  return {
    title: tr('admin.login.title'),
    password: tr('admin.login.password'),
    submit: tr('admin.login.submit'),
    error: tr('admin.login.error'),
    locked: tr('admin.login.locked'),
    unavailable: tr('admin.error.unavailable'),
  }
}

export function setupLabels({ tr }: AdminText): SetupLabels {
  return {
    title: tr('admin.setup.title'),
    intro: tr('admin.setup.intro'),
    code: tr('admin.setup.code'),
    codeHint: tr('admin.setup.codeHint'),
    password: tr('admin.setup.password'),
    passwordHint: tr('admin.setup.passwordHint'),
    confirm: tr('admin.setup.confirm'),
    submit: tr('admin.setup.submit'),
    locked: tr('admin.login.locked'),
    unavailable: tr('admin.error.unavailable'),
    setupGone: tr('admin.setup.unavailable'),
  }
}

export function changePasswordLabels({ tr }: AdminText): ChangePasswordLabels {
  return {
    title: tr('admin.password.title'),
    current: tr('admin.password.current'),
    password: tr('admin.password.new'),
    passwordHint: tr('admin.setup.passwordHint'),
    confirm: tr('admin.password.confirm'),
    submit: tr('admin.password.submit'),
    changed: tr('admin.password.changed'),
    locked: tr('admin.login.locked'),
    unavailable: tr('admin.error.unavailable'),
    unauthorized: tr('admin.sessionEnded'),
  }
}

export function formatDateTime(date: Date, lang: Locale): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CO' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(date)
}
