import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { guestSession } from '@/lib/ai/agent/viewer-server'
import { getRepos } from '@/lib/data'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'cache-control': 'private, no-store' }

const WITHDRAW_MAX = 1000

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('origin') !== request.nextUrl.origin) return new NextResponse(null, { status: 404, headers: PRIVATE })
  try {
    const session = await guestSession()
    if (!session) return new NextResponse(null, { status: 404, headers: PRIVATE })
    const body = (await request.json().catch(() => null)) as { text?: unknown } | null
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, WITHDRAW_MAX) : ''
    if (text.length < 3) return NextResponse.json({ error: 'invalid' }, { status: 400, headers: PRIVATE })
    const repos = getRepos()
    const now = new Date()
    if (!(await hitRateLimit(repos.rateLimits, 'contact', `guest:${session.mode.emailHash.slice(0, 16)}`, now)).allowed) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: PRIVATE })
    }
    await repos.messages.create({
      name: session.mode.name,
      email: session.email,
      phone: null,
      message: `Pedido desde el modo invitada: quiero que retires algo.\n\n${text}`,
      interest: 'other',
      consentAt: now,
    })
    return NextResponse.json({ ok: true }, { headers: PRIVATE })
  } catch (error) {
    logServerError('guest.withdraw', error)
    return NextResponse.json({ error: 'unavailable' }, { status: 503, headers: PRIVATE })
  }
}
