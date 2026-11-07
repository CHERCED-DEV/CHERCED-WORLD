import { synergosShowcase, SYNERGOS_PATH } from '@/content/synergos-showcase'
import { architecture, SYNERGOS_ARCHITECTURE_PATH, sourceHref } from '@/content/synergos-architecture'
import { capabilityDescriptions, createCapabilities, findCapability } from '@/lib/capabilities/registry'
import { cvPdfs, getSite, pick } from '@/lib/content'
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

  const cv = site.profile
    ? [
        '## CV',
        ...cvPdfs('en', site).map((pdf) => `- [${label(t(commonEn, `cv.pdf.${pdf.lang}`))}](${new URL(pdf.href, base).toString()})`),
        `- [${label(t(commonEn, 'cv.link'))}](${site.profile.cv.href})`,
        '',
      ]
    : []

  const lines = [
    '# CHERCED-WORLD',
    '',
    `> ${inline(t(commonEn, 'meta.description'))}`,
    '',
    '## About',
    pair(base, '/aboutMe', t(commonEn, 'nav.about'), t(commonEs, 'nav.about')),
    '',
    ...cv,
    '## Services',
    pair(base, '/services', t(commonEn, 'nav.services'), t(commonEs, 'nav.services')),
    '',
    '## Case studies',
    pair(base, SYNERGOS_PATH, synergosShowcase.copy.title.en, synergosShowcase.copy.title.es),
    pair(base, SYNERGOS_ARCHITECTURE_PATH, architecture.copy.title.en, architecture.copy.title.es),
    ...architecture.patterns.map(pattern => `- [${label(pattern.name)}](${new URL(`${localizedPath('en', SYNERGOS_ARCHITECTURE_PATH)}#patron-${pattern.id}`, base)}): ${inline(pattern.body.en)}${pattern.limitation ? ` ${inline(pattern.limitation.en)}` : ''} ${pattern.sources.map(source => `[${label(source.label)}](${sourceHref(source)})`).join(' · ')}`),
    ...projects.map((project) => `- [${label(project.title)}](${project.url}): ${inline(project.summary)}`),
    '',
    '## Blog',
    ...posts.map((post) => `- [${label(post.title)}](${post.url}): ${inline(post.description)}`),
    '',
    '## Contact',
    pair(base, '/contactMe', pick(site.contact.title, 'en'), pick(site.contact.title, 'es')),
    '',
  ]
  return lines.join('\n')
}
