import { z } from 'zod'
import { fill, toolCopy } from '@/content/mcp/copy'
import { defineTool } from '@/lib/mcp/core/types'
import { localizedPath } from '@/lib/i18n/paths'
import { PAGE_PATHS } from '@/lib/search/pages'
import { fold } from '@/lib/search/text'
import { langOf, langSchema, portfolioIndex } from '../data'
import { markdownLink, siteUrl, source, sourcesSchema, uniqueSources, withSources } from '../sources'

const careerEntry = z.object({ company: z.string(), role: z.string(), start: z.string(), end: z.string().nullable(), description: z.string() })

export const careerOutput = z.object({
  lang: z.enum(['es', 'en']),
  published: z.boolean(),
  career: z.array(careerEntry),
  education: z.array(z.object({ institution: z.string(), degree: z.string(), start: z.string(), end: z.string().nullable() })),
  languages: z.array(z.object({ name: z.string(), level: z.string().nullable() })),
  courses: z.array(z.object({ name: z.string(), description: z.string() })),
  sources: sourcesSchema,
})

export const skillsOutput = z.object({
  lang: z.enum(['es', 'en']),
  skills: z.array(z.object({ id: z.string(), name: z.string(), label: z.string(), level: z.number(), usedIn: z.string().nullable() })),
  areas: z.array(z.object({ id: z.string(), name: z.string(), summary: z.string().nullable(), skills: z.array(z.string()), projects: z.array(z.string()), url: z.url() })),
  technologies: z.array(z.string()),
  sources: sourcesSchema,
})

export const postsOutput = z.object({
  lang: z.enum(['es', 'en']),
  posts: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), date: z.string(), tags: z.array(z.string()), url: z.url() })),
  tags: z.array(z.string()),
  sources: sourcesSchema,
})

function period(start: string, end: string | null, present: string): string {
  return `${start} – ${end ?? present}`
}

export const getCareerTool = defineTool({
  name: 'get_career',
  title: 'Get career and education',
  description: 'Returns the published career timeline (company, role, dates and what was done), education, languages and courses.',
  readOnly: true,
  inputSchema: z.object({ lang: langSchema }),
  outputSchema: careerOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang].career
    const { facts } = await portfolioIndex(lang)
    const about = source(ctx, facts.pages.about.title, localizedPath(lang, PAGE_PATHS.about))
    const sources = [about]
    const published = facts.career.length > 0
    const languages = facts.languages.map((item) => ({ name: item.name, level: item.level }))
    const body = [
      `## ${copy.heading}`,
      published ? facts.career.map((item) => `- **${item.role}**, ${item.company} (${period(item.start, item.end, copy.present)}): ${item.description}`).join('\n') : copy.pending,
      facts.education.length > 0 ? `### ${copy.education}\n${facts.education.map((item) => `- ${item.degree}, ${item.institution} (${period(item.start, item.end, copy.present)})`).join('\n')}` : null,
      `### ${copy.languages}\n${languages.map((item) => `- ${item.name}${item.level ? `: ${item.level}` : ''}`).join('\n')}`,
      facts.courses.length > 0 ? `### ${copy.courses}\n${facts.courses.map((item) => `- ${item.name}: ${item.description}`).join('\n')}` : null,
    ]
      .filter((part): part is string => part !== null)
      .join('\n\n')
    return {
      text: withSources(lang, body, sources),
      structured: { lang, published, career: facts.career, education: facts.education, languages, courses: facts.courses, sources },
      sources,
    }
  },
})

export const getSkillsTool = defineTool({
  name: 'get_skills',
  title: 'Get skills',
  description: 'Returns the skills shown on the site with their self-assessed level and where they were used, grouped in areas with the case studies that prove them, plus every technology in the portfolio.',
  readOnly: true,
  inputSchema: z.object({ lang: langSchema }),
  outputSchema: skillsOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang].skills
    const { facts } = await portfolioIndex(lang)
    const skills = facts.skills.tech.map((item) => ({ id: item.id, name: item.name, label: item.label, level: item.progress, usedIn: item.used }))
    const areas = facts.skills.lobes.map((lobe) => ({ id: lobe.id, name: lobe.name, summary: lobe.words, skills: lobe.skills, projects: lobe.projects, url: siteUrl(ctx.origin, lobe.url) }))
    const sources = uniqueSources([source(ctx, facts.pages.about.title, localizedPath(lang, PAGE_PATHS.about)), ...areas.map((area) => ({ title: area.name, url: area.url }))])
    const body = [
      `## ${copy.heading}`,
      skills.map((item) => `- **${item.label}** (${fill(copy.level, { level: item.level })})${item.usedIn ? `: ${item.usedIn}` : ''}`).join('\n'),
      areas.length > 0 ? `### ${copy.areas}\n${areas.map((area) => `- ${markdownLink({ title: area.name, url: area.url })}${area.summary ? `: ${area.summary}` : ''}`).join('\n')}` : null,
      `### ${copy.technologies}\n${facts.technologies.join(', ')}`,
    ]
      .filter((part): part is string => part !== null)
      .join('\n\n')
    return { text: withSources(lang, body, sources), structured: { lang, skills, areas, technologies: facts.technologies, sources }, sources }
  },
})

export const listPostsTool = defineTool({
  name: 'list_posts',
  title: 'List blog posts',
  description: 'Lists the blog posts, newest first, with date, description, tags and link. Optionally filter by one tag.',
  readOnly: true,
  inputSchema: z.object({ lang: langSchema, tag: z.string().trim().min(1).max(60).optional().describe('Only posts with this tag, for example "IA" or "testing".') }),
  outputSchema: postsOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang].posts
    const { facts } = await portfolioIndex(lang)
    const tags = [...new Set(facts.posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b, lang))
    const wanted = args.tag ? fold(args.tag) : null
    const posts = facts.posts
      .filter((post) => wanted === null || post.tags.some((tag) => fold(tag) === wanted))
      .map((post) => ({ id: post.id, title: post.title, description: post.description, date: post.date, tags: post.tags, url: siteUrl(ctx.origin, post.url) }))
    const blog = source(ctx, facts.pages.blog.title, localizedPath(lang, PAGE_PATHS.blog))
    const sources = uniqueSources([blog, ...posts.map((post) => ({ title: post.title, url: post.url }))])
    const body =
      posts.length > 0
        ? [`## ${fill(copy.heading, { count: posts.length })}`, ...posts.map((post) => `- ${post.date} · ${markdownLink(post)}: ${post.description}`)].join('\n')
        : `${copy.none}\n\n${copy.tags}: ${tags.join(', ')}`
    return { text: withSources(lang, body, sources), structured: { lang, posts, tags, sources }, sources }
  },
})