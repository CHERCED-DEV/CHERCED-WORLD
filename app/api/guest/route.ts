import '@/lib/data/mongo/register'
import { NextResponse } from 'next/server'
import { guestSession } from '@/lib/ai/agent/viewer-server'
import { logServerError } from '@/lib/security/log'

export const dynamic = 'force-dynamic'

const PRIVATE = { 'cache-control': 'private, no-store' }

export async function GET(): Promise<NextResponse> {
  try {
    const session = await guestSession()
    if (!session?.mode.experience) return new NextResponse(null, { status: 404, headers: PRIVATE })
    if (session.off) return NextResponse.json({ off: true }, { headers: PRIVATE })
    return NextResponse.json({ off: false, experience: session.mode.experience }, { headers: PRIVATE })
  } catch (error) {
    logServerError('guest.experience', error)
    return new NextResponse(null, { status: 404, headers: PRIVATE })
  }
}
