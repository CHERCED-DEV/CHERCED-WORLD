import type { Page } from '@playwright/test'
import { getProjects, postIds } from '@/lib/content'

export const LANGS = ['es', 'en'] as const

export type Lang = (typeof LANGS)[number]

const SECTIONS = ['', '/aboutMe', '/services', '/portfolio', '/blog', '/contactMe', '/privacy'] as const

export const PUBLIC_PAGES: readonly string[] = LANGS.flatMap((lang) => [
  ...SECTIONS.map((section) => `/${lang}${section}`),
  ...getProjects().map((project) => `/${lang}/portfolio/${project.id}`),
  ...postIds().map((id) => `/${lang}/blog/${id}`),
])

export const EXTRA_PAGES: readonly string[] = ['/es/no-existe', '/es/blog/catalog', '/es/inbox']

export const AUDIT_PAGES: readonly string[] = [...PUBLIC_PAGES, ...EXTRA_PAGES]

export const BLOG_INDEXES: readonly string[] = LANGS.map((lang) => `/${lang}/blog`)

export function langOf(path: string): Lang {
  return path.startsWith('/en') ? 'en' : 'es'
}

export function slugOf(path: string): string {
  return path.replaceAll('/', '-').replace(/^-/, '') || 'raiz'
}

export async function skipIntro(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cw-intro-seen', '1')
    } catch {}
  })
}
