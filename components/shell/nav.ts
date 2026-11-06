import { t, type Dictionary } from '@/lib/i18n/translate'

export type NavItem = { path: string; label: string }

export const FLOAT_MENU_ID = 'cw-float-menu'

export const NAV_ITEMS = [
  { path: '/', key: 'nav.home' },
  { path: '/aboutMe', key: 'nav.about' },
  { path: '/services', key: 'nav.services' },
  { path: '/portfolio', key: 'nav.portfolio' },
  { path: '/blog', key: 'nav.blog' },
  { path: '/contactMe', key: 'nav.contact' },
] as const

export function navItems(common: Dictionary): NavItem[] {
  return NAV_ITEMS.map((item) => ({ path: item.path, label: t(common, item.key) }))
}

export type ShellLabels = {
  nav: string
  home: string
  back: string
  menuOpen: string
  menuClose: string
  lang: string
  themeDark: string
  palette: string
  paletteHint: string
  backToTop: string
  social: string
  rights: string
  privacy: string
  author: string
  mailbox: string
  mailboxOne: string
  mailboxMany: string
  now: string
  aiLab: string
  egg: string
}

export function shellLabels(common: Dictionary): ShellLabels {
  return {
    nav: t(common, 'nav.main'),
    home: t(common, 'brand.home'),
    back: t(common, 'nav.back'),
    menuOpen: t(common, 'menu.open'),
    menuClose: t(common, 'menu.close'),
    lang: t(common, 'lang.switch'),
    themeDark: t(common, 'theme.dark'),
    palette: t(common, 'palette.open'),
    paletteHint: t(common, 'palette.hint'),
    backToTop: t(common, 'nav.backToTop'),
    social: t(common, 'footer.social'),
    rights: t(common, 'footer.rights'),
    privacy: t(common, 'nav.privacy'),
    author: t(common, 'brand.author'),
    mailbox: t(common, 'mailbox.label'),
    mailboxOne: t(common, 'mailbox.unreadOne'),
    mailboxMany: t(common, 'mailbox.unreadMany'),
    now: t(common, 'nav.now'),
    aiLab: t(common, 'nav.aiLab'),
    egg: t(common, 'footer.egg'),
  }
}

export function parentPath(pathname: string): string | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length < 3) return null
  if (segments[1] === 'inbox' && segments[2] === 'setup') return `/${segments[0]}`
  return `/${segments.slice(0, -1).join('/')}`
}

export function isPaletteShortcut(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>,
): boolean {
  return (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k'
}

const FIRST_YEAR = 2023
const CURRENT_YEAR = new Date().getFullYear()

export function copyrightYears(current: number = CURRENT_YEAR): string {
  return current > FIRST_YEAR ? `${FIRST_YEAR}–${current}` : String(FIRST_YEAR)
}
