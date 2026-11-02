const LOCAL_FALLBACK = 'http://localhost:3000'

function toUrl(raw: string | undefined): URL | null {
  const value = raw?.split(',')[0]?.trim()
  if (!value) return null
  const withProtocol = /^https?:\/\//i.test(value)
    ? value
    : `${/^(localhost|127\.0\.0\.1)(:|$)/.test(value) ? 'http' : 'https'}://${value}`
  try {
    const url = new URL(withProtocol)
    return new URL(url.origin)
  } catch {
    return null
  }
}

export function getSiteUrl(env: Record<string, string | undefined> = process.env): URL {
  return toUrl(env.VERCEL_URL_CORS) ?? toUrl(env.VERCEL_PROJECT_PRODUCTION_URL) ?? new URL(LOCAL_FALLBACK)
}

export function absoluteUrl(path: string, env?: Record<string, string | undefined>): string {
  return new URL(path, getSiteUrl(env)).toString()
}
