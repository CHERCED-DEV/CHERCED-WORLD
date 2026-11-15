import '@/lib/data/mongo/register'
import { unstable_cache } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { codeBlobUrl, codePiece } from '@/content/ailab/code-tour'
import { CODE_QUESTION_MAX, explainCode, fetchCode, simulateExplanation, type CodeExplanation, type CodeFile } from '@/lib/ai/code/explain'
import { agentMode, geminiKey } from '@/lib/ai/gemini'
import { GeminiError } from '@/lib/ai/generate'
import { getRepos } from '@/lib/data'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const PRIVATE = { 'cache-control': 'private, no-store' }

type CodeReply = { file: CodeFile & { url: string }; explanation: CodeExplanation } | { error: string }

function reply(body: CodeReply, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE })
}

const cachedExplanation = unstable_cache(
  async (id: string, lang: Locale) => {
    const piece = codePiece(id)!
    const key = geminiKey()
    if (!key) throw new Error('sin clave de Gemini')
    const file = await fetchCode(piece)
    return explainCode({ key, piece, file, lang })
  },
  ['code-tour-explanation-v1'],
  { revalidate: 7 * 24 * 60 * 60 },
)

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.headers.get('origin') !== request.nextUrl.origin) return reply({ error: 'forbidden' }, 403)
  const body = (await request.json().catch(() => null)) as { id?: unknown; lang?: unknown; question?: unknown } | null
  const piece = codePiece(body?.id)
  if (!piece) return reply({ error: 'not_found' }, 404)
  const lang = typeof body?.lang === 'string' && isLocale(body.lang) ? body.lang : defaultLocale
  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, CODE_QUESTION_MAX) : ''
  const mode = agentMode()
  const key = geminiKey()
  try {
    const file = await fetchCode(piece)
    const withUrl = { ...file, url: codeBlobUrl(piece) }
    if (mode !== 'live' || !key) return reply({ file: withUrl, explanation: simulateExplanation(file, lang) })
    if (process.env.NODE_ENV !== 'development') {
      const repo = getRepos().rateLimits
      const now = new Date()
      const limit = await hitRateLimit(repo, question ? 'codeQuestion' : 'code', await requestIpHash(), now)
      if (!limit.allowed) return reply({ error: 'rate_limited' }, 429)
      const daily = await hitRateLimit(repo, 'codeDaily', 'global', now)
      if (!daily.allowed) return reply({ error: 'daily_cap' }, 429)
    }
    const explanation = question ? await explainCode({ key, piece, file, lang, question }) : await cachedExplanation(piece.id, lang)
    return reply({ file: withUrl, explanation })
  } catch (error) {
    logServerError('ailab.code', error instanceof Error ? error.message : error)
    if (error instanceof GeminiError && error.unavailable) return reply({ error: 'unavailable' }, 503)
    return reply({ error: 'failed' }, 502)
  }
}
