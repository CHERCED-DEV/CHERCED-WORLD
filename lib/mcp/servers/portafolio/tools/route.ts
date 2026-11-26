import { z } from 'zod'
import type { RouteStation } from '@/content/ailab/route/stations'
import { fill, toolCopy } from '@/content/mcp/copy'
import { defineTool, type McpTool } from '@/lib/mcp/core/types'
import { localizedPath } from '@/lib/i18n/paths'
import { langOf, langSchema } from '../data'
import { markdownLink, siteUrl, sourcesSchema, uniqueSources, withSources } from '../sources'

export const routeOutput = z.object({
  lang: z.enum(['es', 'en']),
  totalMinutes: z.number(),
  stations: z.array(
    z.object({
      id: z.string(),
      proof: z.number().int(),
      alsoProves: z.array(z.number().int()),
      title: z.string(),
      minutes: z.number(),
      steps: z.array(z.string()),
      url: z.url(),
      evidence: z.array(z.string()),
      spec: z.string(),
    }),
  ),
  sources: sourcesSchema,
})

export function interviewRouteTool(stations: readonly RouteStation[]): McpTool<unknown, unknown> {
  return defineTool({
    name: 'get_interview_route',
    title: 'Get the 10-minute interview route',
    description: "Returns the stations of the site's 10-minute interviewer route: what each one proves, how long it takes, the steps and the link.",
    readOnly: true,
    inputSchema: z.object({ lang: langSchema }),
    outputSchema: routeOutput,
    async handler(args, ctx) {
      const lang = langOf(args.lang, ctx)
      const copy = toolCopy[lang].route
      const items = stations.map((station) => ({
        id: station.id,
        proof: station.proof,
        alsoProves: [...(station.alsoProves ?? [])],
        title: station.title[lang],
        minutes: station.minutes,
        steps: station.steps.map((step) => step[lang]),
        url: /^https?:\/\//.test(station.href) ? station.href : siteUrl(ctx.origin, localizedPath(lang, station.href)),
        evidence: station.evidence,
        spec: station.spec,
      }))
      const sources = uniqueSources(items.filter((item) => item.url.startsWith(ctx.origin)).map((item) => ({ title: item.title, url: item.url })))
      const totalMinutes = items.reduce((total, item) => total + item.minutes, 0)
      const body = [
        `## ${copy.heading}`,
        ...items.map((item) => `- ${markdownLink(item)} · ${fill(copy.proof, { proof: item.proof })} · ${fill(copy.minutes, { minutes: item.minutes })}\n  ${item.steps.join(' ')}`),
      ].join('\n')
      return { text: withSources(lang, body, sources), structured: { lang, totalMinutes, stations: items, sources }, sources }
    },
  })
}