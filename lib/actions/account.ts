'use server'

import '@/lib/data/mongo/register'
import { refresh, revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { cleanPermissions, normalizeEmail } from '@/lib/accounts/permissions'
import { endAccountSession, getAccountState } from '@/lib/auth/accounts'
import { requireAdmin, UnauthorizedError } from '@/lib/auth/guard'
import { accountPath } from '@/lib/auth/oauth'
import { getRepos } from '@/lib/data'
import type { Repos } from '@/lib/data/types'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'
import { fail, ok, type ActionResult } from './result'

const grantEmail = z.email().max(254)

const MAX_ID_LENGTH = 64

function formLang(formData: FormData): Locale {
  const value = formData.get('lang')
  return typeof value === 'string' && isLocale(value) ? value : defaultLocale
}

function refreshComments(): void {
  revalidatePath('/[lang]/blog/[id]', 'page')
}

async function eraseAccount(repos: Repos, accountId: string): Promise<boolean> {
  await repos.comments.removeByAccount(accountId)
  await repos.accounts.deleteSessionsFor(accountId)
  return repos.accounts.remove(accountId)
}

export async function signOutAccount(formData: FormData): Promise<void> {
  try {
    await endAccountSession()
  } catch (error) {
    logServerError('account.signOut', error)
  }
  redirect(accountPath(formLang(formData)))
}

export async function deleteOwnAccount(formData: FormData): Promise<void> {
  const lang = formLang(formData)
  try {
    const state = await getAccountState()
    if (state) {
      await eraseAccount(getRepos(), state.account.id)
      refreshComments()
    }
    await endAccountSession()
  } catch (error) {
    logServerError('account.deleteOwn', error)
    redirect(`${accountPath(lang)}?error=failed`)
  }
  redirect(`${accountPath(lang)}?deleted=1`)
}

async function asOwner(scope: string, run: (repos: Repos) => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await requireAdmin()
  } catch (error) {
    if (error instanceof UnauthorizedError) return fail('unauthorized')
    logServerError(scope, error)
    return fail('unavailable')
  }
  try {
    return await run(getRepos())
  } catch (error) {
    logServerError(scope, error)
    return fail('unavailable')
  }
}

export async function saveTeamGrant(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return asOwner('account.grant', async (repos) => {
    const email = grantEmail.safeParse(String(formData.get('email') ?? '').trim())
    if (!email.success) return fail('validation', { fieldErrors: { email: 'email' } })
    const permissions = cleanPermissions(formData.getAll('permissions'))
    if (permissions.length === 0) await repos.accounts.removeGrant(email.data)
    else await repos.accounts.setGrant(normalizeEmail(email.data), permissions, new Date())
    refresh()
    return ok()
  })
}

export async function removeTeamGrant(email: string): Promise<ActionResult> {
  return asOwner('account.revoke', async (repos) => {
    if (typeof email !== 'string' || email.length > 254) return fail('validation')
    if (!(await repos.accounts.removeGrant(email))) return fail('not_found')
    refresh()
    return ok()
  })
}

function validId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length <= MAX_ID_LENGTH
}

export async function setAccountBlocked(id: string, blocked: boolean): Promise<ActionResult> {
  return asOwner('account.block', async (repos) => {
    if (!validId(id) || typeof blocked !== 'boolean') return fail('validation')
    if (!(await repos.accounts.setBlocked(id, blocked ? new Date() : null))) return fail('not_found')
    if (blocked) await repos.accounts.deleteSessionsFor(id)
    refresh()
    return ok()
  })
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  return asOwner('account.delete', async (repos) => {
    if (!validId(id)) return fail('validation')
    if (!(await eraseAccount(repos, id))) return fail('not_found')
    refreshComments()
    refresh()
    return ok()
  })
}
