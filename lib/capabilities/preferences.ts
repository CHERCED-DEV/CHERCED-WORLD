import { emit, type Theme } from '@/lib/events'
import type { Locale } from '@/lib/i18n/config'
import { rememberLocale } from '@/lib/i18n/cookie'
import { switchLocaleKeepingTag } from '@/lib/blog/tags'

export type PreferencesPort = {
  language(): Locale
  setLanguage(lang: Locale): void
  theme(): Theme
  setTheme(theme: Theme): void
}

export type BrowserPreferencesOptions = {
  lang: Locale
  pathname: () => string
  navigate: (href: string) => void
}

export function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

export function browserPreferences({ lang, pathname, navigate }: BrowserPreferencesOptions): PreferencesPort {
  return {
    language: () => lang,
    setLanguage(target) {
      if (target === lang) return
      rememberLocale(target)
      navigate(switchLocaleKeepingTag(pathname(), target))
    },
    theme: readTheme,
    setTheme(theme) {
      emit('cw:theme-change', theme)
    },
  }
}
