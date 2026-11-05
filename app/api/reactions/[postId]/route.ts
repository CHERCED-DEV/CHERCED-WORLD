import '@/lib/data/mongo/register'
import { postIds } from '@/lib/content'
import { getRepos } from '@/lib/data'
import type { ReactionCounts } from '@/lib/data/types'
import { logServerError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

const NO_STORE = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' }

export async function GET(_request: Request, context: RouteContext<'/api/reactions/[postId]'>) {
  const { postId } = await context.params
  if (!postIds().includes(postId)) return Response.json({ error: 'not_found' }, { status: 404, headers: NO_STORE })
  try {
    const { clap, idea, fire } = await getRepos().reactions.counts(postId)
    const body: ReactionCounts = { clap, idea, fire }
    return Response.json(body, { headers: { 'cache-control': 'public, max-age=30', 'x-robots-tag': 'noindex' } })
  } catch (error) {
    logServerError('reactions.counts', error)
    return Response.json({ error: 'unavailable' }, { status: 503, headers: NO_STORE })
  }
}
