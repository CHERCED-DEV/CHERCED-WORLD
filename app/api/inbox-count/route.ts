import '@/lib/data/mongo/register'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'

export const revalidate = 30

type InboxCount = { unread: number }

async function countUnread(): Promise<number> {
  try {
    const value = await getRepos().messages.countUnread()
    return Number.isSafeInteger(value) && value > 0 ? value : 0
  } catch (error) {
    logServerError('inbox-count', error)
    return 0
  }
}

export async function GET(): Promise<Response> {
  const body: InboxCount = { unread: await countUnread() }
  return Response.json(body, { headers: { 'x-robots-tag': 'noindex' } })
}
