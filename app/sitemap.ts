import type { MetadataRoute } from 'next'
import { tagSlugsIn } from '@/lib/blog/source'
import { getProjects, listPosts } from '@/lib/content'
import { alternates, defaultLocale, locales, localizedPath, type Locale } from '@/lib/i18n'
import { absoluteUrl } from '@/lib/site-url'

const PUBLIC_PATHS =['/', '/aboutMe', '/services', '/portfolio', '/synergos', '/now', '/ai-lab', '/blog', '/contactMe', '/privacy'] as const

type Entry = { path: string; lastModified?: string; langs?: readonly Locale[] }

async function tagEntries(): Promise<Entry[]> {
  const perLang = await Promise.all(locales.map(async (lang) => [lang, await tagSlugsIn(lang)] as const))
  const langsBySlug = new Map<string, Locale[]>()
  for (const [lang, slugs] of perLang) {
    for (const slug of slugs) langsBySlug.set(slug, [...(langsBySlug.get(slug) ?? []), lang])
  }
  return [...langsBySlug].map(([slug, langs]) => ({ path: `/blog/tag/${encodeURIComponent(slug)}`, langs }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([listPosts(defaultLocale), tagEntries()])
  const entries: Entry[] = [
    ...PUBLIC_PATHS.map((path) => ({ path })),
    ...getProjects().map((project) => ({ path: `/portfolio/${project.id}` })),
    ...posts.map((post) => ({ path: `/blog/${post.id}`, lastModified: post.updated ?? post.date })),
    ...tags,
  ]

  return entries.flatMap(({ path, lastModified, langs = locales }) =>
    langs.map((lang) => {
      const { languages } = alternates(localizedPath(lang, path))
      const listed = Object.entries(languages).filter(([key]) => langs.length === locales.length || langs.includes(key as Locale))
      return {
        url: absoluteUrl(localizedPath(lang, path)),
        lastModified,
        alternates: {
          languages: Object.fromEntries(listed.map(([key, value]) => [key, absoluteUrl(value)])),
        },
      }
    }),
  )
}
