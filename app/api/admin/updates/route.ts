import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { can } from '@/lib/accounts/permissions'
import { getPanelActor } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

const PRIVATE_HEADERS = {
  'cache-control': 'private, no-store, max-age=0',
  'x-robots-tag': 'noindex, nofollow',
}

const OVERLAP_MS = 2000

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: PRIVATE_HEADERS })
}

function parseSince(value: string | null, now: Date): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getTime() > now.getTime() ? now : parsed
}

function changeKey({ id, updatedAt }: { id: string; updatedAt: Date }): { id: string; updatedAt: Date } {
  return { id, updatedAt }
}

export async function GET(request: NextRequest): Promise<Response> {
  const now = new Date()
  let messagesAllowed = false
  let commentsAllowed = false
  try {
    const actor = await getPanelActor()
    if (!actor) return json({ error: 'unauthorized' }, 401)
    messagesAllowed = can(actor, 'messages')
    commentsAllowed = can(actor, 'comments')
  } catch (error) {
    logServerError('admin.updates.session', error)
    return json({ error: 'unavailable' }, 503)
  }

  try {
    const repos = getRepos()
    const since = parseSince(request.nextUrl.searchParams.get('since'), now)
    const window = since ? new Date(since.getTime() - OVERLAP_MS) : null
    const [unread, pending, messages, comments] = await Promise.all([
      messagesAllowed ? repos.messages.countUnread() : Promise.resolve(0),
      commentsAllowed ? repos.comments.countPending() : Promise.resolve(0),
      window && messagesAllowed ? repos.messages.changedSince(window) : Promise.resolve([]),
      window && commentsAllowed ? repos.comments.changedSince(window) : Promise.resolve([]),
    ])
    return json({ now: now.toISOString(), unread, pending, messages: messages.map(changeKey), comments: comments.map(changeKey) }, 200)
  } catch (error) {
    logServerError('admin.updates', error)
    return json({ error: 'unavailable' }, 503)
  }
}
