export {
  locales,
  defaultLocale,
  namespaces,
  isLocale,
  otherLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
  type Namespace,
} from './config'
export { localizedPath, switchLocalePath, alternates, stripLocale, type Alternates } from './paths'
export { t, pickKeys, MissingTranslationError, type Dictionary } from './translate'
export { rememberLocale, localeCookieString } from './cookie'
