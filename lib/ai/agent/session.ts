import 'server-only'
import { GEMINI_API_BASE } from '@/lib/ai/gemini'
import { AGENT_MODEL, AGENT_SESSION_MINUTES, AGENT_VOICE } from './config'
import { AGENT_TOOLS } from './tools'

export const AUTH_TOKENS_URL = `${GEMINI_API_BASE}/auth_tokens`

const TOKEN_TIMEOUT_MS = 8000

const MINUTE = 60_000

export type LiveTokenRequest = {
  uses: 1
  expireTime: string
  newSessionExpireTime: string
  bidiGenerateContentSetup: Record<string, unknown>
}

export function liveSetup(instruction: string, model: string = AGENT_MODEL, voice: string = AGENT_VOICE): Record<string, unknown> {
  return {
    model: `models/${model}`,
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
    },
    systemInstruction: { parts: [{ text: instruction }] },
    tools: AGENT_TOOLS,
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  }
}

export function liveTokenRequest(instruction: string, now: Date): LiveTokenRequest {
  return {
    uses: 1,
    expireTime: new Date(now.getTime() + AGENT_SESSION_MINUTES * MINUTE).toISOString(),
    newSessionExpireTime: new Date(now.getTime() + MINUTE).toISOString(),
    bidiGenerateContentSetup: liveSetup(instruction),
  }
}

export class LiveTokenError extends Error {
  constructor(
    readonly status: number,
    reason = '',
  ) {
    super(`Gemini respondió ${status} al pedir el token${reason ? `: ${reason}` : ''}`)
  }

  get unavailable(): boolean {
    return this.status === 402 || this.status === 403 || this.status === 429
  }
}

async function googleReason(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: { message?: unknown } } | null
  const message = body?.error?.message
  return typeof message === 'string' ? message.replace(/AIza[\w-]+|AQ\.[\w-]+/g, '[clave]').slice(0, 200) : ''
}

export async function createLiveToken(
  key: string,
  instruction: string,
  now: Date,
  fetcher: typeof fetch = fetch,
): Promise<{ token: string; expiresAt: string }> {
  const body = liveTokenRequest(instruction, now)
  const response = await fetcher(AUTH_TOKENS_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    cache: 'no-store',
  })
  if (!response.ok) throw new LiveTokenError(response.status, await googleReason(response))
  const data = (await response.json()) as { name?: unknown }
  if (typeof data.name !== 'string' || !data.name) throw new LiveTokenError(502)
  return { token: data.name, expiresAt: body.expireTime }
}
