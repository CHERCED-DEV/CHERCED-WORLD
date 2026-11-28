import '@/lib/data/mongo/register'
import { unstable_cache } from 'next/cache'
import { monthlySpend } from '@/lib/ai/budget/spend'
import { getRepos } from '@/lib/data'
import { engineeringSpend, SPEND_CACHE_SECONDS, type EngineeringSpend } from '@/lib/engineering/spend'

export const dynamic = 'force-dynamic'

const UNAVAILABLE_CACHE_SECONDS = 60

class SpendUnavailable extends Error {}

const cachedSpend = unstable_cache(
  async (): Promise<EngineeringSpend> => {
    const spend = await engineeringSpend(getRepos().rateLimits, new Date(), (now) => monthlySpend(now))
    if (!spend.available) throw new SpendUnavailable('contadores no disponibles')
    return spend
  },
  ['engineering-spend-v2'],
  { revalidate: SPEND_CACHE_SECONDS, tags: ['engineering-spend'] },
)

export async function GET(): Promise<Response> {
  let body: EngineeringSpend
  try {
    body = await cachedSpend()
  } catch {
    body = { available: false, takenAt: new Date().toISOString() }
  }
  const seconds = body.available ? SPEND_CACHE_SECONDS : UNAVAILABLE_CACHE_SECONDS
  return Response.json(body, {
    headers: { 'cache-control': `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds}`, 'x-robots-tag': 'noindex' },
  })
}
