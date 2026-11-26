import { z } from 'zod'
import ailabEn from '@/content/i18n/en/ailab.json'
import ailabEs from '@/content/i18n/es/ailab.json'
import { fill, toolCopy } from '@/content/mcp/copy'
import { VACANCY_MAX, VACANCY_MIN, type MatchKind, type MatchLevel } from '@/lib/ai/match/config'
import { simulateMatch, vacancyLanguage } from '@/lib/ai/match/simulator'
import { defineTool } from '@/lib/mcp/core/types'
import type { Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/paths'
import { langSchema, portfolioIndex } from '../data'
import { markdownLink, siteUrl, sourcesSchema, uniqueSources, withSources } from '../sources'

const LEVELS = { fuerte: 'strong', parcial: 'partial', sin_evidencia: 'none' } as const satisfies Record<MatchLevel, string>

const KINDS = { obligatorio: 'required', deseable: 'nice_to_have' } as const satisfies Record<MatchKind, string>

const LIMITS_MESSAGE = `text must have between ${VACANCY_MIN} and ${VACANCY_MAX} characters after trimming.`

const A6_TITLE: Record<Locale, string> = { es: ailabEs['ailab.a6.title'], en: ailabEn['ailab.a6.title'] }

export const A6_PATH = '/ai-lab#lab-a6'

export const matchInput = z.object({
  text: z.string().trim().min(VACANCY_MIN, LIMITS_MESSAGE).max(VACANCY_MAX, LIMITS_MESSAGE).describe(`The job description, ${VACANCY_MIN} to ${VACANCY_MAX} characters. It is analyzed in memory and never stored.`),
  lang: langSchema.describe('Language of the evidence. Default: detected from the job description.'),
})

const evidence = z.object({ id: z.string(), title: z.string(), url: z.url(), kind: z.string() })

export const matchOutput = z.object({
  lang: z.enum(['es', 'en']),
  mode: z.literal('deterministic'),
  role: z.string(),
  requirements: z.array(
    z.object({
      text: z.string(),
      kind: z.enum(['required', 'nice_to_have']),
      level: z.enum(['strong', 'partial', 'none']),
      evidence: z.array(evidence),
    }),
  ),
  coverage: z.object({ total: z.number().int(), covered: z.number().int(), required: z.number().int(), requiredCovered: z.number().int() }),
  questions: z.array(z.string()),
  geminiAnalysis: z.url(),
  sources: sourcesSchema,
})

export const matchJobDescriptionTool = defineTool({
  name: 'match_job_description',
  title: 'Match a job description',
  description:
    'Cross-checks a job description against the evidence published on the site, requirement by requirement: strong, partial or no evidence, with links to the case studies, decisions and posts that support it, plus interview questions for the gaps. Deterministic and free: no model is called and the text is not stored. No score.',
  readOnly: true,
  limit: 'mcpMatch',
  inputSchema: matchInput,
  outputSchema: matchOutput,
  async handler(args, ctx) {
    const lang = args.lang ?? vacancyLanguage(args.text)
    const copy = toolCopy[lang].match
    const result = simulateMatch(args.text, await portfolioIndex(lang))
    const requirements = result.requirements.map((item) => ({
      text: item.text,
      kind: KINDS[item.kind],
      level: LEVELS[item.level],
      evidence: item.evidence.map((entry) => ({ id: entry.id, title: entry.title, url: siteUrl(ctx.origin, entry.url), kind: entry.kind })),
    }))
    const geminiAnalysis = siteUrl(ctx.origin, localizedPath(lang, A6_PATH))
    const sources = uniqueSources([...requirements.flatMap((item) => item.evidence.map((entry) => ({ title: entry.title, url: entry.url }))), { title: A6_TITLE[lang], url: geminiAnalysis }])
    const role = result.role || copy.noRole
    const body = [
      `## ${fill(copy.heading, { role })}`,
      copy.deterministic,
      `**${fill(copy.coverage, { ...result.coverage })}**`,
      requirements
        .map((item) => {
          const proof = item.evidence.length > 0 ? ` ${copy.evidence}: ${item.evidence.map((entry) => markdownLink(entry)).join(', ')}` : ''
          return `- **${copy.levels[item.level]}** · ${item.text} (${copy.kinds[item.kind]}).${proof}`
        })
        .join('\n'),
      result.questions.length > 0 ? `### ${copy.questions}\n${result.questions.map((question, position) => `${position + 1}. ${question}`).join('\n')}` : null,
      fill(copy.gemini, { url: geminiAnalysis }),
    ]
      .filter((part): part is string => part !== null)
      .join('\n\n')
    return {
      text: withSources(lang, body, sources),
      structured: { lang, mode: 'deterministic' as const, role, requirements, coverage: result.coverage, questions: result.questions, geminiAnalysis, sources },
      sources,
    }
  },
})