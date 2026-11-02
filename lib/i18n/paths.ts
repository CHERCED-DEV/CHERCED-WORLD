import { defaultLocale, isLocale, locales, type Locale } from './config'

export type Alternates = {
  canonical: string
  languages: Record<Locale | 'x-default', string>
}

function splitSuffix(path: string): { pathname: string; suffix: string } {
  const index = path.search(/[?#]/)
  if (index === -1) return { pathname: path, suffix: '' }
  return { pathname: path.slice(0, index), suffix: path.slice(index) }
}

function normalizePathname(pathname: string): string {
  const withSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  const collapsed = withSlash.replace(/\/{2,}/g, '/')
  return collapsed.length > 1 ? collapsed.replace(/\/$/, '') : collapsed
}

export function stripLocale(path: string): { locale: Locale | null; path: string } {
  const { pathname, suffix } = splitSuffix(path)
  const normalized = normalizePathname(pathname)
  const first = normalized.split('/')[1] ?? ''
  if (!isLocale(first)) return { locale: null, path: `${normalized}${suffix}` }
  const rest = normalized.slice(first.length + 1) || '/'
  return { locale: first, path: `${rest}${suffix}` }
}

export function localizedPath(lang: Locale, path: string): string {
  const { path: bare } = stripLocale(path)
  const { pathname, suffix } = splitSuffix(bare)
  return `/${lang}${pathname === '/' ? '' : pathname}${suffix}`
}

export function switchLocalePath(pathname: string, to: Locale): string {
  return localizedPath(to, pathname)
}

export function alternates(path: string): Alternates {
  const { locale, path: bare } = stripLocale(path)
  const current = locale ?? defaultLocale
  const languages = Object.fromEntries(locales.map((lang) => [lang, localizedPath(lang, bare)])) as Record<Locale, string>
  return {
    canonical: localizedPath(current, bare),
    languages: { ...languages, 'x-default': bare },
  }
}
