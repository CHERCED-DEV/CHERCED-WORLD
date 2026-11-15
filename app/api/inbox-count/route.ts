import '@/lib/data/mongo/register'
import { can } from '@/lib/accounts/permissions'
import { getPanelActor } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

type InboxCount = { unread: number }

async function countUnread(): Promise<number> {
  try {
    const actor = await getPanelActor()
    if (!actor || !can(actor, 'messages')) return 0
    const value = await getRepos().messages.countUnread()
    return Number.isSafeInteger(value) && value > 0 ? value : 0
  } catch (error) {
    logServerError('inbox-count', error)
    return 0
  }
}

export async function GET(): Promise<Response> {
  const body: InboxCount = { unread: await countUnread() }
  return Response.json(body, { headers: { 'x-robots-tag': 'noindex', 'cache-control': 'private, no-store' } })
}
