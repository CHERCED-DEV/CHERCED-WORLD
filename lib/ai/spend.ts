import 'server-only'
import type { RateLimitRepo } from '@/lib/data/types'
import { rateLimitKey, type RateLimitAction } from '@/lib/security/rate-limit'
import { typicalCostUsd } from './models'

export type SpendLine = { id: string; label: { es: string; en: string }; uses: number; since: Date | null; usd: number; unitUsd: number | null }

const LINES: Array<{ id: string; usage: string; action: RateLimitAction; label: { es: string; en: string } }> = [
  { id: 'V5', usage: 'V5', action: 'agentDaily', label: { es: 'Mini Cherced con cuenta', en: 'Mini Cherced with an account' } },
  { id: 'V5-trial', usage: 'V5', action: 'agentTrialDaily', label: { es: 'Mini Cherced, prueba sin cuenta', en: 'Mini Cherced, try without an account' } },
  { id: 'A6', usage: 'A6', action: 'matchDaily', label: { es: '¿Encajo en tu vacante?', en: 'Do I fit your role?' } },
  { id: 'code', usage: 'code', action: 'codeDaily', label: { es: 'Recorrido por el código', en: 'Code walk-through' } },
  { id: 'A9', usage: 'A9', action: 'diagramDaily', label: { es: 'Texto → diagrama', en: 'Text → diagram' } },
  { id: 'A7', usage: 'A7', action: 'writeDaily', label: { es: 'Idea a spec, ADR y haiku', en: 'Idea to spec, ADR and haiku' } },
  { id: 'listen', usage: 'listenChunk', action: 'listenDaily', label: { es: 'Voz de Gemini en los posts (frases nuevas)', en: 'Gemini voice on posts (new sentences)' } },
]

export const SPEND_GLOBAL_KEY = 'global'

export async function spendToday(repo: RateLimitRepo): Promise<SpendLine[]> {
  return Promise.all(
    LINES.map(async (line) => {
      const peek = await repo.peek(rateLimitKey(line.action, SPEND_GLOBAL_KEY))
      const fresh = peek && Date.now() - peek.windowStart.getTime() < 24 * 60 * 60 * 1000 ? peek : null
      const uses = fresh?.count ?? 0
      const unitUsd = typicalCostUsd(line.usage)
      return { id: line.id, label: line.label, uses, since: fresh?.windowStart ?? null, unitUsd, usd: unitUsd === null ? 0 : uses * unitUsd }
    }),
  )
}
