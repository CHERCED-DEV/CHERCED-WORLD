import type { MetadataRoute } from 'next'
import { tagSlugsIn } from '@/lib/blog/source'
import { tagAlternates, tagKey } from '@/lib/blog/tags'
import { getProjects, listPosts } from '@/lib/content'
import { alternates, defaultLocale, locales, localizedPath, type Locale } from '@/lib/i18n'
import { absoluteUrl } from '@/lib/site-url'

const PUBLIC_PATHS =['/', '/aboutMe', '/services', '/portfolio', '/synergos', '/now', '/ai-lab', '/blog', '/contactMe', '/privacy'] as const

type Entry = { path: string; lastModified?: string }

function absoluteLanguages(languages: Partial<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(languages).flatMap(([key, value]) => (value ? [[key, absoluteUrl(value)]] : [])))
}

async function tagEntries(): Promise<MetadataRoute.Sitemap> {
  const perLang = await Promise.all(locales.map(async (lang) => [lang, await tagSlugsIn(lang)] as const))
  const byTag = new Map<string, { slug: string; langs: Locale[] }>()
  for (const [lang, slugs] of perLang) {
    for (const slug of slugs) {
      const found = byTag.get(tagKey(slug))
      byTag.set(tagKey(slug), { slug: found?.slug ?? slug, langs: [...(found?.langs ?? []), lang] })
    }
  }
  return [...byTag.values()].flatMap(({ slug, langs }) =>
    langs.map((lang) => {
      const { canonical, languages } = tagAlternates(lang, slug, langs)
      return { url: absoluteUrl(canonical), alternates: { languages: absoluteLanguages(languages) } }
    }),
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, tags] = await Promise.all([listPosts(defaultLocale), tagEntries()])
  const entries: Entry[] = [
    ...PUBLIC_PATHS.map((path) => ({ path })),
    ...getProjects().map((project) => ({ path: `/portfolio/${project.id}` })),
    ...posts.map((post) => ({ path: `/blog/${post.id}`, lastModified: post.updated ?? post.date })),
  ]

  return [
    ...entries.flatMap(({ path, lastModified }) =>
      locales.map((lang) => ({
        url: absoluteUrl(localizedPath(lang, path)),
        lastModified,
        alternates: { languages: absoluteLanguages(alternates(localizedPath(lang, path)).languages) },
      })),
    ),
    ...tags,
  ]
}
