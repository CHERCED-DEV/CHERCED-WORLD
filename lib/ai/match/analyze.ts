import 'server-only'
import { usageCost } from '@/lib/ai/agent/usage'
import { generateJson } from '@/lib/ai/generate'
import type { SearchIndex } from '@/lib/search/types'
import { evidenceCatalog } from './catalog'
import { MATCH_MODEL, type MatchResult } from './config'
import { matchPrompt, matchSystem } from './prompt'
import { MATCH_OUTPUT_SCHEMA, MatchOutputError, parseModelMatch, sanitizeMatch } from './sanitize'

export const MATCH_ATTEMPTS = 2

export type AnalyzeOptions = { key: string; vacancy: string; index: SearchIndex; fetcher?: typeof fetch }

export async function analyzeVacancy({ key, vacancy, index, fetcher = fetch }: AnalyzeOptions): Promise<MatchResult> {
  const catalog = evidenceCatalog(index)
  const system = matchSystem(index.facts.author)
  const prompt = matchPrompt(vacancy, catalog)
  let costUsd = 0
  let failure: MatchOutputError | null = null
  for (let attempt = 1; attempt <= MATCH_ATTEMPTS; attempt += 1) {
    const reply = await generateJson({ key, model: MATCH_MODEL, system, prompt, schema: MATCH_OUTPUT_SCHEMA }, fetcher)
    costUsd += usageCost(MATCH_MODEL, reply.usage)
    try {
      return sanitizeMatch(parseModelMatch(reply.text), catalog, 'live', costUsd)
    } catch (error) {
      if (!(error instanceof MatchOutputError)) throw error
      failure = error
    }
  }
  throw failure ?? new MatchOutputError('Sin respuesta válida')
}
