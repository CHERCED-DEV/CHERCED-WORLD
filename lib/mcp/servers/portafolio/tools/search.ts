import { z } from 'zod'
import { toolCopy } from '@/content/mcp/copy'
import { GLASS_FRAGMENT_MAX, type GlassResult } from '@/lib/ailab/search/glassbox'
import { defineTool, type McpContext, type McpSource } from '@/lib/mcp/core/types'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { PAGE_PATHS } from '@/lib/search/pages'
import { clip, langOf, langSchema, portfolioBox, portfolioIndex } from '../data'
import { markdownLink, siteUrl, source, sourcesSchema, uniqueSources, withSources } from '../sources'

export const SEARCH_KINDS = ['page', 'project', 'post', 'section', 'skill'] as const

export const SEARCH_MAX_RESULTS = 10

export const SEARCH_DEFAULT_RESULTS = 8

const SEARCH_POOL = 50

export const searchInput = z.object({
  query: z.string().trim().min(1).max(200).describe('What to look for, in Spanish or English. Example: "sagas", "evals", "Synergos".'),
  lang: langSchema,
  kinds: z.array(z.enum(SEARCH_KINDS)).min(1).max(SEARCH_KINDS.length).optional().describe('Only return these kinds of documents.'),
  limit: z.number().int().min(1).max(SEARCH_MAX_RESULTS).optional().describe(`How many results to return, 1 to ${SEARCH_MAX_RESULTS}. Default: ${SEARCH_DEFAULT_RESULTS}.`),
})

const searchHit = z.object({
  rank: z.number().int().min(1),
  id: z.string(),
  kind: z.enum(SEARCH_KINDS),
  title: z.string(),
  url: z.url(),
  fragment: z.string().max(GLASS_FRAGMENT_MAX + 2),
  score: z.number(),
})

export const searchOutput = z.object({
  lang: z.enum(['es', 'en']),
  results: z.array(searchHit).max(SEARCH_MAX_RESULTS),
  total: z.number().int().min(0),
  sources: sourcesSchema,
})

export type SearchHitOutput = z.infer<typeof searchHit>

export function fragmentText(result: GlassResult): string {
  const text = result.fragment?.segments.map((segment) => segment.text).join('') ?? result.doc.text
  return clip(text, GLASS_FRAGMENT_MAX)
}

export async function browseSources(ctx: McpContext, lang: Locale): Promise<McpSource[]> {
  const { facts } = await portfolioIndex(lang)
  return [source(ctx, facts.pages.portfolio.title, localizedPath(lang, PAGE_PATHS.portfolio)), source(ctx, facts.pages.blog.title, localizedPath(lang, PAGE_PATHS.blog))]
}

export async function searchDocs(ctx: McpContext, lang: Locale, query: string, kinds: readonly string[] | undefined, limit: number): Promise<SearchHitOutput[]> {
  const box = await portfolioBox(lang)
  const found = box.search(query, { limit: SEARCH_POOL }).results.filter((result) => !kinds || kinds.includes(result.doc.kind))
  return found.slice(0, limit).map((result, position) => ({
    rank: position + 1,
    id: result.doc.id,
    kind: result.doc.kind,
    title: result.doc.title,
    url: siteUrl(ctx.origin, result.doc.url),
    fragment: fragmentText(result),
    score: Math.round(result.score * 100) / 100,
  }))
}

export const searchPortfolioTool = defineTool({
  name: 'search_portfolio',
  title: 'Search the portfolio',
  description:
    "Full-text search over the public index of Camilo Hernández's portfolio site: case studies, blog posts, skills, services and site pages. Returns ranked results with a short fragment and an absolute link. Use it first when you do not know where something is.",
  readOnly: true,
  inputSchema: searchInput,
  outputSchema: searchOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang]
    const results = await searchDocs(ctx, lang, args.query, args.kinds, args.limit ?? SEARCH_DEFAULT_RESULTS)
    const sources = results.length > 0 ? uniqueSources(results.map((item) => ({ title: item.title, url: item.url }))) : await browseSources(ctx, lang)
    const body =
      results.length > 0
        ? [`## ${copy.search.heading}`, ...results.map((item) => `${item.rank}. ${markdownLink(item)} · ${copy.kinds[item.kind]}\n   ${item.fragment}`)].join('\n\n')
        : copy.search.none
    return { text: withSources(lang, body, sources), structured: { lang, results, total: results.length, sources }, sources }
  },
})