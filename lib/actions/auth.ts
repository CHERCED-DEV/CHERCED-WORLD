'use server'

import '@/lib/data/mongo/register'
import { redirect } from 'next/navigation'
import { endAccountSession } from '@/lib/auth/accounts'
import { endAllSessions, signIn, signOut, requireAdmin, UnauthorizedError } from '@/lib/auth/guard'
import { burnPasswordCheck, hashPassword, verifyPassword } from '@/lib/auth/password'
import { changePasswordSchema, loginSchema } from '@/lib/auth/schemas'
import { verifySetupCode } from '@/lib/auth/setup'
import { getRepos } from '@/lib/data'
import { defaultLocale, isLocale, localizedPath, type Locale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit, resetRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'
import { ERROR_KEYS, formDataToObject, parseForm, parseInput, setupSchema } from '@/lib/validation'
import { fail, ok, type ActionResult } from './result'

const WRONG_CURRENT_PASSWORD = 'admin.password.currentWrong'

function formLang(formData: FormData): Locale {
  const value = formData.get('lang')
  return typeof value === 'string' && isLocale(value) ? value : defaultLocale
}

function inboxPath(lang: Locale): string {
  return localizedPath(lang, '/inbox')
}

export async function login(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = parseInput(loginSchema, formDataToObject(formData))
  if (!parsed.success) return fail('validation', { fieldErrors: parsed.fieldErrors })
  const { password } = parsed.data
  const now = new Date()

  try {
    const repos = getRepos()
    const ip = await requestIpHash()
    const limit = await hitRateLimit(repos.rateLimits, 'login', ip, now)
    if (!limit.allowed) return fail('rate_limited', { retryAfterMs: limit.retryAfterMs })

    const credential = await repos.admin.getCredential()
    if (!credential) {
      await burnPasswordCheck(password)
      return fail('unauthorized')
    }
    if (!(await verifyPassword(password, credential))) return fail('unauthorized')

    await resetRateLimit(repos.rateLimits, 'login', ip)
    await signIn(now)
  } catch (error) {
    logServerError('auth.login', error)
    return fail('unavailable')
  }

  redirect(inboxPath(formLang(formData)))
}

export async function logout(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await signOut()
    await endAccountSession()
  } catch (error) {
    logServerError('auth.logout', error)
  }
  redirect(inboxPath(formLang(formData)))
}

export async function completeSetup(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = parseForm(setupSchema, formData)
  if (!parsed.success) return fail('validation', { fieldErrors: parsed.fieldErrors })
  const now = new Date()

  try {
    const repos = getRepos()
    if (await repos.admin.getCredential()) return fail('not_found')

    const ip = await requestIpHash()
    const limit = await hitRateLimit(repos.rateLimits, 'setup', ip, now)
    if (!limit.allowed) return fail('rate_limited', { retryAfterMs: limit.retryAfterMs })

    if (!(await verifySetupCode(repos.admin, parsed.data.code, now))) {
      return fail('validation', { fieldErrors: { code: ERROR_KEYS.code } })
    }

    const credential = await hashPassword(parsed.data.password, now)
    if (!(await repos.admin.createCredential(credential))) return fail('not_found')
    await repos.admin.deleteSetupCode()
    await resetRateLimit(repos.rateLimits, 'setup', ip)
    await signIn(now)
  } catch (error) {
    logServerError('auth.setup', error)
    return fail('unavailable')
  }

  redirect(inboxPath(formLang(formData)))
}

export async function changePassword(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail('unauthorized')
    logServerError('auth.changePassword', error)
    return fail('unavailable')
  }

  const parsed = parseForm(changePasswordSchema, formData)
  if (!parsed.success) return fail('validation', { fieldErrors: parsed.fieldErrors })
  const now = new Date()

  try {
    const repos = getRepos()
    const ip = await requestIpHash()
    const limit = await hitRateLimit(repos.rateLimits, 'login', ip, now)
    if (!limit.allowed) return fail('rate_limited', { retryAfterMs: limit.retryAfterMs })

    const credential = await repos.admin.getCredential()
    if (!credential) return fail('unavailable')
    if (!(await verifyPassword(parsed.data.current, credential))) {
      return fail('validation', { fieldErrors: { current: WRONG_CURRENT_PASSWORD } })
    }

    const next = await hashPassword(parsed.data.password, now)
    await repos.admin.updateCredential({ ...next, createdAt: credential.createdAt })
    await resetRateLimit(repos.rateLimits, 'login', ip)
    await endAllSessions(now)
    return ok()
  } catch (error) {
    logServerError('auth.changePassword', error)
    return fail('unavailable')
  }
}
