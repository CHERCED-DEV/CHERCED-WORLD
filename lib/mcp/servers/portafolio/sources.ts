import { z } from 'zod'
import { toolCopy } from '@/content/mcp/copy'
import type { McpContext, McpSource } from '@/lib/mcp/core/types'
import type { Locale } from '@/lib/i18n/config'

export const sourceSchema = z.object({ title: z.string().min(1), url: z.url() })

export const sourcesSchema = z.array(sourceSchema).min(1)

export function siteUrl(origin: string, path: string): string {
  return new URL(path, origin).toString()
}

export function isSiteUrl(origin: string, url: string): boolean {
  try {
    return new URL(url).origin === new URL(origin).origin
  } catch {
    return false
  }
}

export function source(ctx: Pick<McpContext, 'origin'>, title: string, path: string): McpSource {
  return { title, url: siteUrl(ctx.origin, path) }
}

export function uniqueSources(sources: readonly McpSource[]): McpSource[] {
  const seen = new Set<string>()
  return sources.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}

export function markdownLink(item: McpSource): string {
  return `[${item.title.replace(/[[\]]/g, '')}](${item.url})`
}

export function sourcesBlock(lang: Locale, sources: readonly McpSource[]): string {
  return [`**${toolCopy[lang].sources}**`, ...sources.map((item) => `- ${markdownLink(item)}`)].join('\n')
}

export function withSources(lang: Locale, body: string, sources: readonly McpSource[]): string {
  return `${body.trim()}\n\n${sourcesBlock(lang, sources)}`
}