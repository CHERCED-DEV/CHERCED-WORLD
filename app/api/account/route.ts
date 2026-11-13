import '@/lib/data/mongo/register'
import type { AccountSummary } from '@/lib/accounts/summary'
import { getAccountState } from '@/lib/auth/accounts'
import { logServerError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = { 'cache-control': 'private, no-store, max-age=0', 'x-robots-tag': 'noindex, nofollow' }

export async function GET(): Promise<Response> {
  let body: AccountSummary = { signedIn: false }
  try {
    const state = await getAccountState()
    if (state) body = { signedIn: true, name: state.account.name }
  } catch (error) {
    logServerError('account.me', error)
  }
  return Response.json(body, { headers: PRIVATE_HEADERS })
}
