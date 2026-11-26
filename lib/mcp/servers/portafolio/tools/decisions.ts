import { z } from 'zod'
import { fill, toolCopy } from '@/content/mcp/copy'
import { createGlassBox } from '@/lib/ailab/search/glassbox'
import { defineTool, McpToolError } from '@/lib/mcp/core/types'
import { localizedPath } from '@/lib/i18n/paths'
import { PAGE_PATHS } from '@/lib/search/pages'
import type { SearchDoc } from '@/lib/search/types'
import { langOf, langSchema, portfolioIndex } from '../data'
import { markdownLink, siteUrl, source, sourcesSchema, uniqueSources, withSources } from '../sources'
import { caseIds } from './cases'

export const DECISIONS_MAX = 15

const decision = z.object({
  id: z.string(),
  caseId: z.string(),
  caseTitle: z.string(),
  decision: z.string(),
  why: z.string(),
  tradeoff: z.string(),
  url: z.url(),
})

export const decisionsOutput = z.object({
  lang: z.enum(['es', 'en']),
  decisions: z.array(decision).max(DECISIONS_MAX),
  total: z.number().int().min(0),
  sources: sourcesSchema,
})

type Decision = z.infer<typeof decision>

export const getDecisionsTool = defineTool({
  name: 'get_decisions',
  title: 'Get architecture decisions',
  description:
    'Returns the architecture decision cards published in the case studies: the decision, why it was made and what was sacrificed. Filter by case id, by a free-text query, or both.',
  readOnly: true,
  inputSchema: z.object({
    caseId: z.string().trim().min(1).max(40).optional().describe('Only decisions of this case study id, for example "12".'),
    query: z.string().trim().min(1).max(200).optional().describe('Only decisions that match this text, for example "compensation" or "tests".'),
    lang: langSchema,
  }),
  outputSchema: decisionsOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang]
    const { facts } = await portfolioIndex(lang)
    if (args.caseId && !facts.projects.some((project) => project.id === args.caseId)) {
      throw new McpToolError(fill(copy.caseStudy.unknown, { ids: caseIds(facts.projects) }))
    }
    const all: Decision[] = facts.projects
      .filter((project) => !args.caseId || project.id === args.caseId)
      .flatMap((project) =>
        project.adrs.map((item, position) => ({
          id: `decision:${project.id}-${position + 1}`,
          caseId: project.id,
          caseTitle: project.title,
          decision: item.decision,
          why: item.why,
          tradeoff: item.tradeoff,
          url: siteUrl(ctx.origin, project.url),
        })),
      )
    let matched = all
    if (args.query) {
      const docs: SearchDoc[] = all.map((item) => ({ id: item.id, kind: 'section', title: item.decision, text: `${item.why} ${item.tradeoff}`, keywords: item.caseTitle, url: item.url }))
      const byId = new Map(all.map((item) => [item.id, item]))
      matched = createGlassBox({ docs })
        .search(args.query, { limit: DECISIONS_MAX })
        .results.map((result) => byId.get(result.doc.id))
        .filter((item): item is Decision => item !== undefined)
    }
    const decisions = matched.slice(0, DECISIONS_MAX)
    const sources =
      decisions.length > 0
        ? uniqueSources(decisions.map((item) => ({ title: item.caseTitle, url: item.url })))
        : [source(ctx, facts.pages.portfolio.title, localizedPath(lang, PAGE_PATHS.portfolio))]
    const body =
      decisions.length > 0
        ? [
            `## ${fill(copy.decisions.heading, { count: decisions.length, total: matched.length })}`,
            ...decisions.map(
              (item) => `- **${item.decision}** (${markdownLink({ title: item.caseTitle, url: item.url })})\n  ${copy.caseStudy.why}: ${item.why}\n  ${copy.caseStudy.tradeoff}: ${item.tradeoff}`,
            ),
          ].join('\n')
        : copy.decisions.none
    return { text: withSources(lang, body, sources), structured: { lang, decisions, total: matched.length, sources }, sources }
  },
})