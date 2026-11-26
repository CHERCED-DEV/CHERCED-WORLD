import '@/lib/data/mongo/register'
import { createHash } from 'node:crypto'
import { unstable_cache } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { agentMode, geminiKey } from '@/lib/ai/gemini'
import { GeminiError } from '@/lib/ai/generate'
import { listenCorpus } from '@/lib/ai/listen/corpus'
import { synthesizeSpeech } from '@/lib/ai/listen/speech'
import { inCorpus, isListenSource, isListenVoice, LISTEN_TEXT_MAX } from '@/lib/ai/listen/voices'
import { getRepos } from '@/lib/data'
import { isLocale } from '@/lib/i18n/config'
import { logServerError } from '@/lib/security/log'
import { hitRateLimit } from '@/lib/security/rate-limit'
import { requestIpHash } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

export const maxDuration = 60

const PRIVATE = { 'cache-control': 'private, no-store' }

const LISTEN_AUDIO_CACHE = 'public, max-age=86400, s-maxage=31536000, immutable'

const LISTEN_STATUS_CACHE = 'public, max-age=60, s-maxage=300'

class ListenLimited extends Error {}

function reply(body: unknown, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: PRIVATE })
}

function live(): boolean {
  return agentMode() === 'live' && geminiKey() !== null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams
  if (!params.has('t')) return NextResponse.json({ available: live() }, { headers: { 'cache-control': LISTEN_STATUS_CACHE } })
  if (request.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'forbidden' }, 403)
  const source = params.get('s')
  const lang = params.get('l')
  const voice = params.get('v')
  const text = (params.get('t') ?? '').replace(/\s+/g, ' ').trim()
  if (!isListenSource(source) || !lang || !isLocale(lang) || !isListenVoice(voice) || !text || text.length > LISTEN_TEXT_MAX) return reply({ error: 'invalid' }, 400)
  if (!live()) return reply({ error: 'off' }, 404)
  const corpus = await listenCorpus(source, lang)
  if (!corpus || !inCorpus(corpus, text)) return reply({ error: 'not_in_source' }, 403)
  const visitor = process.env.NODE_ENV === 'development' ? null : await requestIpHash()
  const digest = createHash('sha256').update(text).digest('hex').slice(0, 32)
  const generate = unstable_cache(
    async () => {
      if (visitor) {
        const repo = getRepos().rateLimits
        const now = new Date()
        if (!(await hitRateLimit(repo, 'listen', visitor, now)).allowed) throw new ListenLimited('visitor')
        if (!(await hitRateLimit(repo, 'listenDaily', 'global', now)).allowed) throw new ListenLimited('daily')
      }
      const key = geminiKey()
      if (!key) throw new GeminiError(403, 'sin clave de Gemini')
      const audio = await synthesizeSpeech({ key, text, voice })
      return Buffer.from(audio.wav).toString('base64')
    },
    ['listen-audio-v1', source, lang, voice, digest],
    { revalidate: false, tags: ['listen-audio'] },
  )
  try {
    const bytes = new Uint8Array(Buffer.from(await generate(), 'base64'))
    return new NextResponse(bytes, {
      headers: { 'content-type': 'audio/wav', 'content-length': String(bytes.length), 'cache-control': LISTEN_AUDIO_CACHE },
    })
  } catch (error) {
    if (error instanceof ListenLimited) return reply({ error: 'rate_limited' }, 429)
    logServerError('listen', error instanceof Error ? error.message : error)
    if (error instanceof GeminiError && error.unavailable) return reply({ error: 'unavailable' }, 503)
    return reply({ error: 'failed' }, 502)
  }
}
