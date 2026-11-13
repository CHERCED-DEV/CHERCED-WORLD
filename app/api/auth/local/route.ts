import '@/lib/data/mongo/register'
import { NextResponse, type NextRequest } from 'next/server'
import { completeSignIn, signInMode } from '@/lib/auth/google'
import { accountPath, displayName, safeNext } from '@/lib/auth/oauth'
import { defaultLocale, isLocale } from '@/lib/i18n/config'

export const dynamic = 'force-dynamic'

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}$/

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (signInMode() !== 'local') return new NextResponse(null, { status: 404 })
  if (request.headers.get('origin') !== request.nextUrl.origin) return new NextResponse(null, { status: 403 })

  const form = await request.formData()
  const requested = field(form, 'lang')
  const lang = isLocale(requested) ? requested : defaultLocale
  const email = field(form, 'email').toLowerCase()
  if (!EMAIL.test(email)) return NextResponse.redirect(new URL(`${accountPath(lang)}?error=failed`, request.nextUrl.origin), 303)

  const result = await completeSignIn({ googleSub: `local:${email}`, email, name: displayName(field(form, 'name'), email) }, new Date())
  const next = result === 'blocked' ? `${accountPath(lang)}?error=blocked` : safeNext(field(form, 'next'), lang)
  return NextResponse.redirect(new URL(next, request.nextUrl.origin), 303)
}
