import type { MetadataRoute } from 'next'
import { getProjects, listPosts } from '@/lib/content'
import { alternates, defaultLocale, locales, localizedPath } from '@/lib/i18n'
import { absoluteUrl } from '@/lib/site-url'

const PUBLIC_PATHS = ['/', '/aboutMe', '/services', '/portfolio', '/blog', '/contactMe', '/privacy'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await listPosts(defaultLocale)
  const entries: Array<{ path: string; lastModified?: string }> = [
    ...PUBLIC_PATHS.map((path) => ({ path })),
    ...getProjects().map((project) => ({ path: `/portfolio/${project.id}` })),
    ...posts.map((post) => ({ path: `/blog/${post.id}`, lastModified: post.date })),
  ]

  return entries.flatMap(({ path, lastModified }) =>
    locales.map((lang) => {
      const { languages } = alternates(localizedPath(lang, path))
      return {
        url: absoluteUrl(localizedPath(lang, path)),
        lastModified,
        alternates: {
          languages: Object.fromEntries(Object.entries(languages).map(([key, value]) => [key, absoluteUrl(value)])),
        },
      }
    }),
  )
}
