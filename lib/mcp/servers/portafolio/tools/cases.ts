import { z } from 'zod'
import { fill, toolCopy } from '@/content/mcp/copy'
import { approvedPitch } from '@/content/pitches'
import { defineTool, McpToolError } from '@/lib/mcp/core/types'
import { localizedPath } from '@/lib/i18n/paths'
import { PAGE_PATHS } from '@/lib/search/pages'
import type { ProjectFact } from '@/lib/search/types'
import { langOf, langSchema, portfolioIndex } from '../data'
import { markdownLink, siteUrl, source, sourcesSchema, uniqueSources, withSources } from '../sources'

const caseSummary = z.object({
  id: z.string(),
  title: z.string(),
  era: z.string(),
  summary: z.string(),
  technologies: z.array(z.string()),
  url: z.url(),
  hasPitch: z.boolean(),
})

export const listCasesOutput = z.object({ lang: z.enum(['es', 'en']), cases: z.array(caseSummary), sources: sourcesSchema })

const adr = z.object({ decision: z.string(), why: z.string(), tradeoff: z.string() })

export const caseStudyOutput = z.object({
  lang: z.enum(['es', 'en']),
  id: z.string(),
  title: z.string(),
  era: z.string(),
  summary: z.string(),
  context: z.string(),
  role: z.string().nullable(),
  decisions: z.string().nullable(),
  adrs: z.array(adr),
  result: z.string().nullable(),
  technologies: z.array(z.string()),
  url: z.url(),
  links: z.object({ live: z.string().nullable(), github: z.string().nullable(), repos: z.array(z.object({ label: z.string(), href: z.string() })) }),
  pitch: z.string().nullable(),
  sources: sourcesSchema,
})

export function caseIds(projects: readonly ProjectFact[]): string {
  return projects.map((project) => project.id).join(', ')
}

export const listCaseStudiesTool = defineTool({
  name: 'list_case_studies',
  title: 'List case studies',
  description: 'Lists every case study in the portfolio with its id, era, one-line summary, stack and link. Use the id with get_case_study or get_decisions.',
  readOnly: true,
  inputSchema: z.object({ lang: langSchema }),
  outputSchema: listCasesOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang]
    const { facts } = await portfolioIndex(lang)
    const cases = facts.projects.map((project) => ({
      id: project.id,
      title: project.title,
      era: project.era,
      summary: project.summary,
      technologies: project.technologies,
      url: siteUrl(ctx.origin, project.url),
      hasPitch: approvedPitch(project.id) !== undefined,
    }))
    const sources = uniqueSources([source(ctx, facts.pages.portfolio.title, localizedPath(lang, PAGE_PATHS.portfolio)), ...cases.map((item) => ({ title: item.title, url: item.url }))])
    const body = [
      `## ${fill(copy.cases.heading, { count: cases.length })}`,
      ...cases.map((item) => `- \`${item.id}\` ${markdownLink(item)} (${item.era}${item.hasPitch ? `, ${copy.cases.pitch}` : ''}): ${item.summary}`),
      copy.cases.hint,
    ].join('\n')
    return { text: withSources(lang, body, sources), structured: { lang, cases, sources }, sources }
  },
})

export const getCaseStudyTool = defineTool({
  name: 'get_case_study',
  title: 'Get a case study',
  description:
    'Returns one case study in full: problem and context, role, architecture decisions with why and what was sacrificed, stack, results, public links and the approved 60-second pitch when there is one. Get valid ids from list_case_studies.',
  readOnly: true,
  inputSchema: z.object({ id: z.string().trim().min(1).max(40).describe('Case study id, for example "12" (Synergos).'), lang: langSchema }),
  outputSchema: caseStudyOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang].caseStudy
    const { facts } = await portfolioIndex(lang)
    const project = facts.projects.find((item) => item.id === args.id)
    if (!project) throw new McpToolError(fill(copy.unknown, { ids: caseIds(facts.projects) }))
    const url = siteUrl(ctx.origin, project.url)
    const pitch = approvedPitch(project.id)?.script[lang] ?? null
    const sources = [{ title: project.title, url }]
    const links = [project.live ? `- ${copy.live}: ${project.live}` : null, project.github ? `- ${copy.code}: ${project.github}` : null, ...project.repos.map((repo) => `- ${repo.label}: ${repo.href}`)].filter(
      (line): line is string => line !== null,
    )
    const body = [
      `## ${project.title} (${project.era})`,
      `**${copy.summary}:** ${project.summary}`,
      `**${copy.context}:** ${project.context}`,
      project.role ? `**${copy.role}:** ${project.role}` : null,
      project.decisions ? `**${copy.decisions}:** ${project.decisions}` : null,
      ...project.adrs.map((item, position) => `${position + 1}. **${item.decision}**\n   ${copy.why}: ${item.why}\n   ${copy.tradeoff}: ${item.tradeoff}`),
      project.result ? `**${copy.result}:** ${project.result}` : null,
      `**${copy.stack}:** ${project.technologies.join(', ')}`,
      links.length > 0 ? `**${copy.links}:**\n${links.join('\n')}` : null,
      pitch ? `**${copy.pitch}:** ${pitch}` : null,
    ]
      .filter((line): line is string => line !== null)
      .join('\n\n')
    return {
      text: withSources(lang, body, sources),
      structured: {
        lang,
        id: project.id,
        title: project.title,
        era: project.era,
        summary: project.summary,
        context: project.context,
        role: project.role,
        decisions: project.decisions,
        adrs: project.adrs,
        result: project.result,
        technologies: project.technologies,
        url,
        links: { live: project.live, github: project.github, repos: project.repos },
        pitch,
        sources,
      },
      sources,
    }
  },
})