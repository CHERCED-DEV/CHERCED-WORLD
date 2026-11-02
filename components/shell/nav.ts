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
  }
}
