import type { SiteContent } from '@/content/types'
import { getProjects, getSite, listPosts, pick } from '@/lib/content'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { getDictionary } from '@/lib/i18n/server'
import { t, type Dictionary } from '@/lib/i18n/translate'
import { PAGE_KEYWORDS, PAGE_ORDER, PAGE_PATHS, PAGE_TITLE_KEYS } from './pages'
import { fold } from './text'
import {
  SEARCH_INDEX_VERSION,
  type AssistantFacts,
  type PageFact,
  type PageId,
  type PostFact,
  type ProjectFact,
  type SearchDoc,
  type SearchIndex,
} from './types'

export function publicEmail(site: SiteContent): string | null {
  const href = site.socials.find((social) => social.id === 'email')?.href
  if (!href || !href.startsWith('mailto:')) return null
  return href.slice('mailto:'.length).split('?')[0] ?? null
}

function mergeTechnologies(skills: string[], projects: string[][]): string[] {
  const seen = new Set<string>()
  const merged: string[] = []
  for (const name of [...skills, ...projects.flat()]) {
    const key = fold(name).replace(/\s+/g, '')
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(name)
  }
  return merged
}

function buildFacts(lang: Locale, common: Dictionary, site: SiteContent, posts: PostFact[]): AssistantFacts {
  const pages = Object.fromEntries(
    PAGE_ORDER.map((id) => [id, { title: t(common, PAGE_TITLE_KEYS[id]), url: localizedPath(lang, PAGE_PATHS[id]) }]),
  ) as Record<PageId, PageFact>

  const careerPublished = site.about.career.every((entry) => !entry.pending)
  const projects: ProjectFact[] = getProjects().map((project) => ({
    id: project.id,
    title: project.title,
    summary: pick(project.summary, lang),
    details: [project.context, project.role, project.decisions, project.result]
      .filter((value) => value !== null)
      .map((value) => pick(value, lang)),
    technologies: project.technologies,
    url: localizedPath(lang, `/portfolio/${project.id}`),
    live: project.links.live,
    github: project.links.github,
  }))
  const skillTech = [...site.about.skills.tech].sort((a, b) => b.progress - a.progress)

  return {
    author: t(common, 'brand.author'),
    pages,
    about: pick(site.about.description, lang),
    skills: {
      intro: pick(site.about.skills.description, lang),
      bullets: site.about.skills.bullets.map((bullet) => pick(bullet, lang)),
      tech: skillTech.map((tech) => ({ name: tech.name, progress: tech.progress })),
    },
    technologies: mergeTechnologies(
      skillTech.map((tech) => tech.name),
      projects.map((project) => project.technologies),
    ),
    career: careerPublished
      ? site.about.career.map((entry) => ({
          company: entry.company,
          role: pick(entry.role, lang),
          start: entry.start,
          end: entry.end,
          description: pick(entry.description, lang),
        }))
      : [],
    education: site.about.education
      .filter((entry) => !entry.pending)
      .map((entry) => ({ institution: entry.institution, degree: pick(entry.degree, lang), start: entry.start, end: entry.end })),
    courses: site.about.courses.schools.map((school) => ({
      name: pick(school.name, lang),
      description: pick(school.description, lang),
    })),
    platzi: { href: site.about.courses.platzi.href, label: pick(site.about.courses.platzi.label, lang) },
    languages: site.about.languages.map((language) => ({ name: pick(language.name, lang), progress: language.progress })),
    services: {
      intro: pick(site.services.intro, lang),
      items: site.services.items.map((item) => ({
        id: item.id,
        title: pick(item.title, lang),
        description: pick(item.description, lang),
      })),
    },
    portfolioIntro: site.portfolio.intro.map((paragraph) => pick(paragraph, lang)),
    projects,
    posts,
    blogWelcome: pick(site.blog.welcome, lang),
    contact: { description: pick(site.contact.description, lang), email: publicEmail(site) },
    socials: site.socials
      .filter((social): social is typeof social & { href: string } => social.href !== null)
      .map((social) => ({ id: social.id, label: pick(social.label, lang), href: social.href })),
  }
}

function pageText(id: PageId, facts: AssistantFacts, site: SiteContent, lang: Locale): string {
  switch (id) {
    case 'home':
      return `${pick(site.home.greeting, lang)} ${site.home.name}. ${pick(site.home.title, lang)}`
    case 'about':
      return facts.about
    case 'services':
      return facts.services.intro
    case 'portfolio':
      return facts.portfolioIntro.join(' ')
    case 'blog':
      return facts.blogWelcome
    case 'contact':
      return facts.contact.description
    case 'privacy':
      return site.privacy.sections.map((section) => pick(section.heading, lang)).join('. ')
  }
}

function buildDocs(lang: Locale, facts: AssistantFacts, site: SiteContent, experience: Dictionary): SearchDoc[] {
  const docs: SearchDoc[] = PAGE_ORDER.map((id) => ({
    id: `page:${id}`,
    kind: 'page',
    title: facts.pages[id].title,
    text: pageText(id, facts, site, lang),
    keywords: PAGE_KEYWORDS[id],
    url: facts.pages[id].url,
  }))

  for (const project of facts.projects) {
    docs.push({
      id: `project:${project.id}`,
      kind: 'project',
      title: project.title,
      text: [project.summary, ...project.details].join(' '),
      keywords: project.technologies.join(' '),
      url: project.url,
    })
  }

  for (const post of facts.posts) {
    docs.push({
      id: `post:${post.id}`,
      kind: 'post',
      title: post.title,
      text: post.description,
      keywords: post.tags.join(' '),
      url: post.url,
    })
  }

  const about = facts.pages.about.url
  const section = (id: string, text: string, keywords: string, url = about): SearchDoc => ({
    id: `section:${id}`,
    kind: 'section',
    title: t(experience, `search.section.${id}`),
    text,
    keywords,
    url,
  })

  docs.push(
    section(
      'skills',
      [facts.skills.intro, ...facts.skills.bullets].join(' '),
      facts.skills.tech.map((tech) => tech.name).join(' '),
    ),
    section(
      'education',
      facts.education.map((entry) => `${entry.degree}, ${entry.institution}`).join('. '),
      'educacion education estudios studies universidad university',
    ),
    section(
      'courses',
      facts.courses.map((course) => `${course.name}: ${course.description}`).join(' '),
      'cursos courses platzi certificados certificates',
    ),
    section(
      'languages',
      facts.languages.map((language) => `${language.name} ${language.progress}%`).join(', '),
      'idiomas languages',
    ),
  )

  if (facts.career.length > 0) {
    docs.push(
      section(
        'career',
        facts.career.map((entry) => `${entry.role}, ${entry.company}. ${entry.description}`).join(' '),
        'carrera career experiencia experience trabajo work',
      ),
    )
  }

  for (const item of facts.services.items) {
    docs.push({
      id: `section:service-${item.id}`,
      kind: 'section',
      title: item.title,
      text: item.description,
      keywords: 'servicio service',
      url: facts.pages.services.url,
    })
  }

  return docs
}

async function buildPosts(lang: Locale): Promise<PostFact[]> {
  const posts = await listPosts(lang)
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    description: post.description,
    date: post.date,
    tags: post.tags,
    url: localizedPath(lang, `/blog/${post.id}`),
  }))
}

export async function buildSearchIndex(lang: Locale): Promise<SearchIndex> {
  const [common, experience, posts] = await Promise.all([
    getDictionary(lang, 'common'),
    getDictionary(lang, 'experience'),
    buildPosts(lang),
  ])
  const site = getSite()
  const facts = buildFacts(lang, common, site, posts)
  return { version: SEARCH_INDEX_VERSION, lang, docs: buildDocs(lang, facts, site, experience), facts }
}
