import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { t, type Dictionary } from '@/lib/i18n/translate'
import type { PageId, SearchDoc } from './types'

export const PAGE_PATHS: Record<PageId, string> = {
  home: '/',
  about: '/aboutMe',
  services: '/services',
  portfolio: '/portfolio',
  blog: '/blog',
  contact: '/contactMe',
  privacy: '/privacy',
}

export const PAGE_TITLE_KEYS: Record<PageId, string> = {
  home: 'nav.home',
  about: 'nav.about',
  services: 'nav.services',
  portfolio: 'nav.portfolio',
  blog: 'nav.blog',
  contact: 'nav.contact',
  privacy: 'nav.privacy',
}

export const PAGE_KEYWORDS: Record<PageId, string> = {
  home: 'inicio home cherced world',
  about: 'sobre mi about me perfil profile skills habilidades educacion education cursos courses idiomas languages',
  services: 'servicios services diseno design desarrollo development mantenimiento maintenance',
  portfolio: 'portafolio portfolio proyectos projects trabajos work',
  blog: 'blog posts articulos articles',
  contact: 'contacto contactame contact correo email mensaje message',
  privacy: 'privacidad privacy datos data politica policy',
}

export const PAGE_ORDER: PageId[] = ['home', 'about', 'services', 'portfolio', 'blog', 'contact', 'privacy']

export function pageDocs(lang: Locale, common: Dictionary): SearchDoc[] {
  return PAGE_ORDER.map((id) => ({
    id: `page:${id}`,
    kind: 'page',
    title: t(common, PAGE_TITLE_KEYS[id]),
    text: '',
    keywords: PAGE_KEYWORDS[id],
    url: localizedPath(lang, PAGE_PATHS[id]),
  }))
}
