import { z } from 'zod'
import { toolCopy } from '@/content/mcp/copy'
import { defineTool } from '@/lib/mcp/core/types'
import { localizedPath } from '@/lib/i18n/paths'
import { PAGE_PATHS } from '@/lib/search/pages'
import { langOf, langSchema, portfolioIndex } from '../data'
import { markdownLink, siteUrl, source, sourcesSchema, uniqueSources, withSources } from '../sources'

export const contactOutput = z.object({
  lang: z.enum(['es', 'en']),
  contact: z.object({ url: z.url(), description: z.string(), email: z.string().nullable() }),
  profiles: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })),
  cv: z.object({ profile: z.string().nullable(), pdfs: z.array(z.object({ lang: z.enum(['es', 'en']), label: z.string(), url: z.url(), bytes: z.number() })) }),
  sources: sourcesSchema,
})

export const getContactOptionsTool = defineTool({
  name: 'get_contact_options',
  title: 'Get contact options',
  description: "Returns the public ways to reach Camilo: the contact page, his public email, his public profiles (such as LinkedIn and GitHub) and his CV as PDF in Spanish and English.",
  readOnly: true,
  inputSchema: z.object({ lang: langSchema }),
  outputSchema: contactOutput,
  async handler(args, ctx) {
    const lang = langOf(args.lang, ctx)
    const copy = toolCopy[lang].contact
    const { facts } = await portfolioIndex(lang)
    const page = source(ctx, facts.pages.contact.title, localizedPath(lang, PAGE_PATHS.contact))
    const profiles = facts.socials.filter((social) => social.id !== 'email').map((social) => ({ id: social.id, label: social.label, url: social.href }))
    const pdfs = (facts.cv?.pdfs ?? []).map((pdf) => ({ lang: pdf.lang, label: pdf.label, url: siteUrl(ctx.origin, pdf.href), bytes: pdf.bytes }))
    const sources = uniqueSources([page, ...pdfs.map((pdf) => ({ title: pdf.label, url: pdf.url }))])
    const body = [
      `## ${copy.heading}`,
      `- ${copy.page}: ${markdownLink(page)}. ${facts.contact.description}`,
      facts.contact.email ? `- ${copy.email}: ${facts.contact.email}` : null,
      facts.cv ? `- ${copy.profile}: ${facts.cv.href}` : null,
      profiles.length > 0 ? `### ${copy.socials}\n${profiles.map((profile) => `- ${profile.label}: ${profile.url}`).join('\n')}` : null,
      pdfs.length > 0 ? `### ${copy.cv}\n${pdfs.map((pdf) => `- ${markdownLink({ title: pdf.label, url: pdf.url })}`).join('\n')}` : null,
    ]
      .filter((part): part is string => part !== null)
      .join('\n')
    return {
      text: withSources(lang, body, sources),
      structured: { lang, contact: { url: page.url, description: facts.contact.description, email: facts.contact.email }, profiles, cv: { profile: facts.cv?.href ?? null, pdfs }, sources },
      sources,
    }
  },
})