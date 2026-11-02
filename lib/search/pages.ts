import type { PageId } from './types'

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
