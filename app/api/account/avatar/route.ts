import '@/lib/data/mongo/register'
import type { NextRequest } from 'next/server'
import { getAccountState, getPanelActor } from '@/lib/auth/accounts'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

const NOT_FOUND = { status: 404, headers: { 'cache-control': 'private, no-store' } }

async function ownerOf(request: NextRequest): Promise<string | null> {
  const requested = request.nextUrl.searchParams.get('account')
  if (requested) {
    if (requested.length > 64 || (await getPanelActor())?.kind !== 'owner') return null
    return requested
  }
  return (await getAccountState())?.account.id ?? null
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const accountId = await ownerOf(request)
    if (!accountId) return new Response(null, NOT_FOUND)
    const image = await getRepos().profiles.getAvatar(accountId)
    if (!image) return new Response(null, NOT_FOUND)
    return new Response(new Uint8Array(image.data), {
      headers: {
        'content-type': image.type,
        'content-length': String(image.data.byteLength),
        'cache-control': 'private, max-age=86400',
        'x-content-type-options': 'nosniff',
        'content-security-policy': "default-src 'none'; sandbox",
        'x-robots-tag': 'noindex, nofollow',
      },
    })
  } catch (error) {
    logServerError('account.avatar', error)
    return new Response(null, { status: 503, headers: { 'cache-control': 'private, no-store' } })
  }
}
