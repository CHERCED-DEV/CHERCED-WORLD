import '@/lib/data/mongo/register'
import { buildAccountExport, guestPostsOf, type GuestPost } from '@/lib/accounts/data'
import { getAccountState } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'cache-control': 'private, no-store, max-age=0', 'x-robots-tag': 'noindex, nofollow' }

async function safeGuestPosts(account: Parameters<typeof guestPostsOf>[0]): Promise<GuestPost[]> {
  try {
    return await guestPostsOf(account)
  } catch (error) {
    logServerError('account.export.posts', error)
    return []
  }
}

export async function GET(): Promise<Response> {
  try {
    const state = await getAccountState()
    if (!state) return Response.json({ error: 'unauthorized' }, { status: 401, headers: PRIVATE })
    const repos = getRepos()
    const now = new Date()
    const hit = await hitRateLimit(repos.rateLimits, 'accountExport', `download-${state.account.id}`, now)
    if (!hit.allowed) {
      return Response.json(
        { error: 'rate_limited' },
        { status: 429, headers: { ...PRIVATE, 'retry-after': String(Math.ceil(hit.retryAfterMs / 1000)) } },
      )
    }
    const [profile, avatar, comments, guestPosts] = await Promise.all([
      repos.profiles.get(state.account.id),
      repos.profiles.getAvatar(state.account.id),
      repos.comments.listByAccount(state.account.id),
      safeGuestPosts(state.account),
    ])
    const body = buildAccountExport({ now, account: state.account, permissions: state.permissions, profile, avatar, comments, guestPosts })
    return new Response(JSON.stringify(body, null, 2), {
      headers: {
        ...PRIVATE,
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="cherced-world-mis-datos-${now.toISOString().slice(0, 10)}.json"`,
        'x-content-type-options': 'nosniff',
      },
    })
  } catch (error) {
    logServerError('account.export', error)
    return Response.json({ error: 'unavailable' }, { status: 503, headers: PRIVATE })
  }
}
