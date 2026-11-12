import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { requireAdmin, UnauthorizedError } from '@/lib/auth/guard'
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
  try {
    await requireAdmin({ touch: false })
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: 'unauthorized' }, 401)
    logServerError('admin.updates.session', error)
    return json({ error: 'unavailable' }, 503)
  }

  try {
    const repos = getRepos()
    const since = parseSince(request.nextUrl.searchParams.get('since'), now)
    const window = since ? new Date(since.getTime() - OVERLAP_MS) : null
    const [unread, pending, messages, comments] = await Promise.all([
      repos.messages.countUnread(),
      repos.comments.countPending(),
      window ? repos.messages.changedSince(window) : Promise.resolve([]),
      window ? repos.comments.changedSince(window) : Promise.resolve([]),
    ])
    return json({ now: now.toISOString(), unread, pending, messages: messages.map(changeKey), comments: comments.map(changeKey) }, 200)
  } catch (error) {
    logServerError('admin.updates', error)
    return json({ error: 'unavailable' }, 503)
  }
}
