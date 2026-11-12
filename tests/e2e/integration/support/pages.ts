import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import { getProjects, postIds } from '@/lib/content'

export const LANGS = ['es', 'en'] as const

export type Lang = (typeof LANGS)[number]

const SECTIONS = ['', '/aboutMe', '/services', '/portfolio', '/blog', '/contactMe', '/privacy', '/now', '/ai-lab', '/synergos', '/synergos/arquitectura'] as const

export const PUBLIC_PAGES: readonly string[] = LANGS.flatMap((lang) => [
  ...SECTIONS.map((section) => `/${lang}${section}`),
  ...getProjects().map((project) => `/${lang}/portfolio/${project.id}`),
  ...postIds().map((id) => `/${lang}/blog/${id}`),
])

export const EXTRA_PAGES: readonly string[] = ['/es/no-existe', '/es/blog/catalog', '/es/inbox']

export const AUDIT_PAGES: readonly string[] = [...PUBLIC_PAGES, ...EXTRA_PAGES]

export const KEY_PAGES: readonly string[] = ['/es', '/en/aboutMe', '/es/services', '/es/portfolio/12', '/es/contactMe', '/en/now']

export const EXHAUSTIVE = '@exhaustive'

export function tierTag(url: string): { tag?: string } {
  return KEY_PAGES.includes(url) ? {} : { tag: EXHAUSTIVE }
}

export const BLOG_INDEXES: readonly string[] = LANGS.map((lang) => `/${lang}/blog`)

export const ROOT = path.resolve(__dirname, '..', '..', '..', '..')

export function pendingFile(file: string, owner: string): string | null {
  return existsSync(path.join(ROOT, file)) ? null : `pendiente: ${file} llega con ${owner}; se audita al integrar`
}

const PENDING_ROUTES: ReadonlyArray<{ match: RegExp; file: string; owner: string }> = [
  { match: /^\/(es|en)\/now$/, file: 'app/[lang]/now/page.tsx', owner: 'P1 (T422)' },
]

export function pendingPage(url: string): string | null {
  const route = PENDING_ROUTES.find((item) => item.match.test(url))
  return route ? pendingFile(route.file, route.owner) : null
}

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

export async function originalAboutHeight(page: Page): Promise<{ height: number; noTocar: number }> {
  return page.evaluate(() => {
    const knowledge = document.querySelector('[data-cw-scene="knowledge"]')!.getBoundingClientRect().bottom
    const heading = document.querySelector('[data-cw-scene="heading"]')?.getBoundingClientRect().bottom ?? knowledge
    const button = document.querySelector<HTMLElement>('[data-cw-no-tocar]')
    let noTocar = 0
    if (button) {
      const full = document.documentElement.scrollHeight
      button.style.display = 'none'
      noTocar = full - document.documentElement.scrollHeight
      button.style.removeProperty('display')
    }
    return { height: document.documentElement.scrollHeight - (heading - knowledge) - noTocar, noTocar }
  })
}
