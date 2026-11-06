import { synergosShowcase, SYNERGOS_PATH } from '@/content/synergos-showcase'
import { capabilityDescriptions, createCapabilities, findCapability } from '@/lib/capabilities/registry'
import { getSite, pick } from '@/lib/content'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { getDictionary } from '@/lib/i18n/server'
import { t } from '@/lib/i18n/translate'
import { buildSearchIndex } from '@/lib/search/build-index'
import { getSiteUrl } from '@/lib/site-url'

type ListedProject = { title: string; summary: string; url: string }

type ListedPost = { title: string; description: string; url: string }

function inline(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function label(value: string): string {
  return inline(value).replace(/([[\]\\])/g, '\\$1')
}

function pair(base: URL, path: string, en: string, es: string): string {
  const url = (lang: Locale) => new URL(localizedPath(lang, path), base).toString()
  return `- [${label(en)}](${url('en')}) · [${label(es)}](${url('es')})`
}

export async function buildLlmsTxt(base: URL = getSiteUrl()): Promise<string> {
  const [commonEn, commonEs, experienceEs, experienceEn] = await Promise.all([
    getDictionary('en', 'common'),
    getDictionary('es', 'common'),
    getDictionary('es', 'experience'),
    getDictionary('en', 'experience'),
  ])
  const site = getSite()
  const capabilities = createCapabilities({
    loadIndex: buildSearchIndex,
    descriptions: capabilityDescriptions(experienceEs, experienceEn),
    areas: (site.about.skills.lobes ?? []).map((lobe) => lobe.id),
    origin: base.origin,
  })
  const context = { lang: 'en' as const }
  const [{ projects }, { posts }] = (await Promise.all([
    findCapability(capabilities, 'list_projects').execute({}, context),
    findCapability(capabilities, 'list_posts').execute({}, context),
  ])) as [{ projects: ListedProject[] }, { posts: ListedPost[] }]

  const lines = [
    '# CHERCED-WORLD',
    '',
    `> ${inline(t(commonEn, 'meta.description'))}`,
    '',
    '## About',
    pair(base, '/aboutMe', t(commonEn, 'nav.about'), t(commonEs, 'nav.about')),
    '',
    '## Services',
    pair(base, '/services', t(commonEn, 'nav.services'), t(commonEs, 'nav.services')),
    '',
    '## Case studies',
    pair(base, SYNERGOS_PATH, synergosShowcase.copy.title.en, synergosShowcase.copy.title.es),
    ...projects.map((project) => `- [${label(project.title)}](${project.url}): ${inline(project.summary)}`),
    '',
    '## Blog',
    ...posts.map((post) => `- [${label(post.title)}](${post.url}): ${inline(post.description)}`),
    '',
    '## Contact',
    pair(base, '/contactMe', pick(site.contact.title, 'en'), pick(site.contact.title, 'es')),
    ...(site.profile?.cv.pdf ? [`- [${label(t(commonEn, 'cv.download'))}](${new URL(site.profile.cv.pdf.href, base).toString()})`] : []),
    ...(site.profile ? [`- [${label(t(commonEn, 'cv.link'))}](${site.profile.cv.href})`] : []),
    '',
  ]
  return lines.join('\n')
}
