'use server'

import '@/lib/data/mongo/register'
import { refresh, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  AVATAR_MAX_BYTES,
  fieldErrors,
  photoSourceSchema,
  preferencesSchema,
  PROFILE_CONSENT_VERSION,
  profileFieldsFrom,
  profileFieldsSchema,
  sniffAvatar,
} from '@/lib/accounts/profile'
import { getAccountState } from '@/lib/auth/accounts'
import { accountPath } from '@/lib/auth/oauth'
import { getRepos } from '@/lib/data'
import type { AccountRecord, ProfileConsent, ProfilePatch, Repos } from '@/lib/data/types'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit, type RateLimitAction } from '@/lib/security/rate-limit'
import { fail, ok, type ActionResult } from './result'

type Context = { repos: Repos; account: AccountRecord; now: Date }

const MAX_ID_LENGTH = 64

function formLang(formData: FormData): Locale {
  const value = formData.get('lang')
  return typeof value === 'string' && isLocale(value) ? value : defaultLocale
}

async function withAccount<T>(
  scope: string,
  limit: { action: RateLimitAction; bucket: string },
  run: (context: Context) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  let account: AccountRecord
  try {
    const state = await getAccountState()
    if (!state) return fail('unauthorized')
    account = state.account
  } catch (error) {
    logServerError(scope, error)
    return fail('unavailable')
  }
  try {
    const repos = getRepos()
    const now = new Date()
    const hit = await hitRateLimit(repos.rateLimits, limit.action, `${limit.bucket}-${account.id}`, now)
    if (!hit.allowed) return fail('rate_limited', { retryAfterMs: hit.retryAfterMs })
    return await run({ repos, account, now })
  } catch (error) {
    logServerError(scope, error)
    return fail('unavailable')
  }
}

function consentFrom(formData: FormData, now: Date): ProfileConsent | null {
  return formData.get('consent') === 'on' ? { version: PROFILE_CONSENT_VERSION, acceptedAt: now } : null
}

async function saveWithConsent(context: Context, patch: ProfilePatch, formData: FormData): Promise<ActionResult> {
  const saved = await context.repos.profiles.save(context.account.id, patch, context.now, consentFrom(formData, context.now))
  if (!saved) return fail('consent_required', { fieldErrors: { consent: 'required' } })
  refresh()
  return ok()
}

export async function grantProfileConsent(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return withAccount('profile.consent', { action: 'profile', bucket: 'consent' }, (context) => saveWithConsent(context, {}, formData))
}

export async function saveProfile(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return withAccount('profile.save', { action: 'profile', bucket: 'fields' }, async (context) => {
    const parsed = profileFieldsSchema.safeParse(profileFieldsFrom(formData))
    if (!parsed.success) return fail('validation', { fieldErrors: fieldErrors(parsed.error) })
    return saveWithConsent(context, parsed.data, formData)
  })
}

export async function savePreferences(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return withAccount('profile.preferences', { action: 'profile', bucket: 'prefs' }, async (context) => {
    const parsed = preferencesSchema.safeParse({ lang: formData.get('prefLang'), theme: formData.get('prefTheme') })
    if (!parsed.success) return fail('validation', { fieldErrors: fieldErrors(parsed.error) })
    return saveWithConsent(context, { preferences: parsed.data }, formData)
  })
}

export async function uploadAvatar(_prev: ActionResult<number> | null, formData: FormData): Promise<ActionResult<number>> {
  return withAccount('profile.avatar', { action: 'avatar', bucket: 'upload' }, async (context) => {
    const file = formData.get('avatar')
    if (!(file instanceof Blob) || file.size === 0) return fail('validation', { fieldErrors: { avatar: 'required' } })
    if (file.size > AVATAR_MAX_BYTES) return fail('validation', { fieldErrors: { avatar: 'tooLarge' } })
    const data = new Uint8Array(await file.arrayBuffer())
    const type = sniffAvatar(data)
    if (!type) return fail('validation', { fieldErrors: { avatar: 'invalid' } })
    const result = await saveWithConsent(context, { avatar: { type, data }, photo: 'upload' }, formData)
    return result.ok ? ok(context.now.getTime()) : result
  })
}

export async function setPhotoSource(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return withAccount('profile.photo', { action: 'profile', bucket: 'photo' }, async (context) => {
    const parsed = photoSourceSchema.safeParse(formData.get('photo'))
    if (!parsed.success) return fail('validation', { fieldErrors: { photo: 'invalid' } })
    if (parsed.data === 'google' && !context.account.picture) return fail('validation', { fieldErrors: { photo: 'noGoogle' } })
    if (parsed.data === 'upload' && !(await context.repos.profiles.get(context.account.id))?.avatar) {
      return fail('validation', { fieldErrors: { photo: 'noUpload' } })
    }
    const patch: ProfilePatch = parsed.data === 'none' ? { photo: 'none', avatar: null } : { photo: parsed.data }
    return saveWithConsent(context, patch, formData)
  })
}

export async function deleteOwnComment(id: string): Promise<ActionResult> {
  return withAccount('profile.comment', { action: 'profile', bucket: 'comments' }, async ({ repos, account }) => {
    if (typeof id !== 'string' || id.length === 0 || id.length > MAX_ID_LENGTH) return fail('validation')
    if (!(await repos.comments.removeOwn(id, account.id))) return fail('not_found')
    revalidatePath('/[lang]/blog/[id]', 'page')
    refresh()
    return ok()
  })
}

export async function withdrawProfile(formData: FormData): Promise<void> {
  const lang = formLang(formData)
  try {
    const state = await getAccountState()
    if (state) await getRepos().profiles.remove(state.account.id)
  } catch (error) {
    logServerError('profile.withdraw', error)
    redirect(`${accountPath(lang)}?error=failed`)
  }
  redirect(`${accountPath(lang)}?withdrawn=1`)
}
