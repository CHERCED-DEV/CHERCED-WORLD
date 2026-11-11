import { NextResponse, type NextRequest } from 'next/server'
import { projects } from '@/content/projects'
import { postRegistry } from '@/content/posts/registry'
import { findTag, tagSlug } from '@/lib/blog/tags'
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_HEADER,
  type Locale,
} from '@/lib/i18n/config'

const BLOG_PAGES = new Set(['catalog'])

const BYPASS_PREFIXES = ['/_next', '/api', '/capsule']

export function shouldBypass(pathname: string): boolean {
  if (BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return true
  const last = pathname.split('/').pop() ?? ''
  return last.includes('.')
}

export function localeFromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().toLowerCase().split(';')
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith('q='))
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1
      return { primary: tag.split('-')[0] ?? '', q: Number.isFinite(q) ? q : 0, index }
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
  const match = ranked.find((entry) => isLocale(entry.primary))
  return match && isLocale(match.primary) ? match.primary : null
}

export function preferredLocale(request: NextRequest): Locale {
  const fromCookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (isLocale(fromCookie)) return fromCookie
  return localeFromAcceptLanguage(request.headers.get('accept-language')) ?? defaultLocale
}

export function isDocumentNavigation(request: NextRequest): boolean {
  const headers = request.headers
  const dest = headers.get('sec-fetch-dest')
  const purpose = `${headers.get('sec-purpose') ?? ''} ${headers.get('purpose') ?? ''}`
  return (dest === null || dest === 'document') && !purpose.includes('prefetch')
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl
  if (shouldBypass(pathname)) return NextResponse.next()

  const first = pathname.split('/')[1] ?? ''
  if (isLocale(first)) {
    const headers = new Headers(request.headers)
    headers.set(LOCALE_HEADER, first)
    const parts = pathname.split('/').filter(Boolean).map(part => {
      try { return decodeURIComponent(part) } catch { return part }
    })
    const missingProject = parts.length === 3 && parts[1] === 'portfolio' && !projects.some(project => project.id === parts[2])
    const missingPost = parts.length === 3 && parts[1] === 'blog' && !BLOG_PAGES.has(parts[2]) && !Object.hasOwn(postRegistry, parts[2])
    const missingTag = parts.length === 4 && parts[1] === 'blog' && parts[2] === 'tag' && (!findTag(parts[3]) || tagSlug(parts[3]) !== parts[3])
    const missing = missingProject || missingPost || missingTag
    const destination = request.nextUrl.clone()
    if (missing) destination.pathname = `/${first}/__missing-content`
    const response = missing
      ? NextResponse.rewrite(destination, { request: { headers } })
      : NextResponse.next({ request: { headers } })
    if (isDocumentNavigation(request) && request.cookies.get(LOCALE_COOKIE)?.value !== first) {
      response.cookies.set(LOCALE_COOKIE, first, {
        path: '/',
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: 'lax',
      })
    }
    return response
  }

  const locale = preferredLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`
  const response = NextResponse.redirect(url, 307)
  response.headers.set('Vary', 'Cookie, Accept-Language')
  return response
}

export const config = {
  matcher: ['/((?!_next/|api/|capsule/|.*\\.[^/]+$).*)'],
}
