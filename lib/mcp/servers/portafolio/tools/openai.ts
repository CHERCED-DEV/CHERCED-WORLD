import { z } from 'zod'
import { fill, toolCopy } from '@/content/mcp/copy'
import { defineTool, McpToolError } from '@/lib/mcp/core/types'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { projectDetails } from '@/lib/search/facts'
import { portfolioBox, portfolioIndex, queryLanguage } from '../data'
import { siteUrl } from '../sources'
import { browseSources, searchDocs, SEARCH_MAX_RESULTS } from './search'

const KINDS = ['page', 'project', 'post', 'section', 'skill'] as const

export const openAiSearchOutput = z.object({ results: z.array(z.object({ id: z.string(), title: z.string(), url: z.url() })).max(SEARCH_MAX_RESULTS) })

export const openAiFetchOutput = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string().min(1),
  url: z.url(),
  metadata: z.object({ kind: z.enum(KINDS), lang: z.enum(['es', 'en']) }),
})

export function documentId(lang: Locale, id: string): string {
  return `${lang}:${id}`
}

export function parseDocumentId(value: string): { lang: Locale; id: string } {
  const match = /^([a-z]{2}):(.+)$/.exec(value)
  if (match && isLocale(match[1])) return { lang: match[1], id: match[2]! }
  return { lang: 'en', id: value }
}

export const searchTool = defineTool({
  name: 'search',
  title: 'Search (ChatGPT connectors)',
  description:
    'Searches the public portfolio of Camilo Hernández and returns {results: [{id, title, url}]}. Pass an id to fetch to read the full document. The language (Spanish or English) is detected from the query. Same index as search_portfolio, in the shape that ChatGPT deep research and connectors expect.',
  readOnly: true,
  inputSchema: z.object({ query: z.string().trim().min(1).max(200).describe('What to look for, in Spanish or English.') }),
  outputSchema: openAiSearchOutput,
  async handler(args, ctx) {
    const lang = queryLanguage(args.query)
    const hits = await searchDocs(ctx, lang, args.query, undefined, SEARCH_MAX_RESULTS)
    const results = hits.map((hit) => ({ id: documentId(lang, hit.id), title: hit.title, url: hit.url }))
    const structured = { results }
    const sources = results.length > 0 ? results.map((item) => ({ title: item.title, url: item.url })) : await browseSources(ctx, lang)
    return { text: JSON.stringify(structured), structured, sources }
  },
})

export const fetchTool = defineTool({
  name: 'fetch',
  title: 'Fetch a document (ChatGPT connectors)',
  description: 'Returns the full text of one document from the public portfolio by the id that search returned, as {id, title, text, url, metadata}.',
  readOnly: true,
  inputSchema: z.object({ id: z.string().trim().min(1).max(160).describe('A document id from search, for example "en:project:12".') }),
  outputSchema: openAiFetchOutput,
  async handler(args, ctx) {
    const { lang, id } = parseDocumentId(args.id)
    const doc = (await portfolioBox(lang)).doc(id)
    if (!doc) throw new McpToolError(fill(toolCopy[lang].fetch.unknown, {}))
    const { facts } = await portfolioIndex(lang)
    const project = doc.kind === 'project' ? facts.projects.find((item) => `project:${item.id}` === doc.id) : undefined
    const text = (project ? [project.summary, ...projectDetails(project)].join('\n\n') : doc.text).trim() || doc.title
    const url = siteUrl(ctx.origin, doc.url)
    const structured = { id: documentId(lang, doc.id), title: doc.title, text, url, metadata: { kind: doc.kind, lang } }
    return { text: JSON.stringify(structured), structured, sources: [{ title: doc.title, url }] }
  },
})