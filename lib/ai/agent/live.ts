import { base64ToInt16, INPUT_RATE, int16ToBase64 } from '@/lib/ai/agent/pcm'
import { parseUsage, type LiveUsage } from '@/lib/ai/agent/usage'

export const LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained'

export type LiveFunctionCall = { id: string; name: string; args: Record<string, unknown> }

export type LiveFunctionResponse = { id: string; name: string; response: Record<string, unknown> }

export type LiveCloseReason = 'ended' | 'expired' | 'error'

export type LiveEvents = {
  onOpen?: () => void
  onAudio?: (pcm: Int16Array) => void
  onInputTranscript?: (text: string) => void
  onOutputTranscript?: (text: string) => void
  onInterrupted?: () => void
  onTurnComplete?: () => void
  onToolCall?: (calls: LiveFunctionCall[]) => Promise<LiveFunctionResponse[]> | LiveFunctionResponse[]
  onUsage?: (usage: LiveUsage) => void
  onVoiceActivity?: (activity: 'start' | 'end') => void
  onClose?: (reason: LiveCloseReason, detail?: string) => void
}

export type WebSocketLike = {
  readyState: number
  binaryType: string
  send(data: string): void
  close(code?: number, reason?: string): void
  onopen: ((event: unknown) => void) | null
  onmessage: ((event: { data: unknown }) => void) | null
  onclose: ((event: { code: number; reason: string }) => void) | null
  onerror: ((event: unknown) => void) | null
}

export type LiveSessionOptions = { token: string; model: string; events: LiveEvents; socket?: (url: string) => WebSocketLike }

export type LiveSession = {
  readonly state: () => 'connecting' | 'open' | 'closed'
  sendAudio(chunk: Int16Array): void
  sendText(text: string): void
  endAudio(): void
  close(): void
}

type LiveState = 'connecting' | 'open' | 'closed'

type Json = Record<string, unknown>

const SOCKET_OPEN = 1

const AUDIO_MIME = `audio/pcm;rate=${INPUT_RATE}`

const EXPIRED_HINT = /expir|deadline|quota|token/i

const utf8 = new TextDecoder()

export function liveUrl(token: string): string {
  return `${LIVE_WS_URL}?access_token=${encodeURIComponent(token)}`
}

function browserSocket(url: string): WebSocketLike {
  const socket = new WebSocket(url)
  socket.binaryType = 'arraybuffer'
  return socket as unknown as WebSocketLike
}

function record(value: unknown): Json | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : undefined
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

async function decode(data: unknown): Promise<string | undefined> {
  if (typeof data === 'string') return data
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) return utf8.decode(data)
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data.text()
  return undefined
}

function parse(raw: string | undefined): Json | undefined {
  if (raw === undefined) return undefined
  try {
    return record(JSON.parse(raw))
  } catch {
    return undefined
  }
}

function modelPath(model: string): string {
  return `models/${model.replace(/^models\//, '')}`
}

function functionCalls(value: unknown): LiveFunctionCall[] {
  const calls = record(value)?.functionCalls
  if (!Array.isArray(calls)) return []
  return calls.flatMap((entry) => {
    const call = record(entry)
    return call ? [{ id: text(call.id) ?? '', name: text(call.name) ?? '', args: record(call.args) ?? {} }] : []
  })
}

function rejectAll(calls: LiveFunctionCall[], error: string): LiveFunctionResponse[] {
  return calls.map(({ id, name }) => ({ id, name, response: { error } }))
}

function report(error: unknown): void {
  setTimeout(() => {
    throw error
  }, 0)
}

export function openLiveSession(options: LiveSessionOptions): LiveSession {
  const { events } = options
  let status: LiveState = 'connecting'
  let finished = false
  let inbox: Promise<void> = Promise.resolve()
  let socket: WebSocketLike | undefined

  function finish(reason: LiveCloseReason, detail?: string) {
    if (finished) return
    finished = true
    status = 'closed'
    if (detail === undefined) events.onClose?.(reason)
    else events.onClose?.(reason, detail)
  }

  function send(payload: Json) {
    if (!finished && socket && socket.readyState === SOCKET_OPEN) socket.send(JSON.stringify(payload))
  }

  function playAudio(value: unknown) {
    const inline = record(value)
    const mimeType = text(inline?.mimeType)
    const data = text(inline?.data)
    if (!data || !mimeType || !mimeType.startsWith('audio/pcm')) return
    let pcm: Int16Array
    try {
      pcm = base64ToInt16(data)
    } catch {
      return
    }
    if (pcm.length > 0) events.onAudio?.(pcm)
  }

  function serve(content: Json) {
    const input = text(record(content.inputTranscription)?.text)
    if (input) events.onInputTranscript?.(input)
    const parts = record(content.modelTurn)?.parts
    if (Array.isArray(parts)) for (const part of parts) playAudio(record(part)?.inlineData)
    const output = text(record(content.outputTranscription)?.text)
    if (output) events.onOutputTranscript?.(output)
    if (content.interrupted === true) events.onInterrupted?.()
    if (content.turnComplete === true) events.onTurnComplete?.()
  }

  async function answer(calls: LiveFunctionCall[]) {
    let responses: LiveFunctionResponse[]
    if (!events.onToolCall) {
      responses = rejectAll(calls, 'unsupported')
    } else {
      try {
        responses = await events.onToolCall(calls)
      } catch {
        responses = rejectAll(calls, 'failed')
      }
    }
    send({ toolResponse: { functionResponses: responses } })
  }

  function handle(message: Json) {
    if (finished) return
    if (message.setupComplete !== undefined && status === 'connecting') {
      status = 'open'
      events.onOpen?.()
    }
    const activity = text(record(message.voiceActivity)?.type)
    if (activity === 'ACTIVITY_START') events.onVoiceActivity?.('start')
    else if (activity === 'ACTIVITY_END') events.onVoiceActivity?.('end')
    const usage = parseUsage(message.usageMetadata)
    if (usage && !finished) events.onUsage?.(usage)
    const content = record(message.serverContent)
    if (content && !finished) serve(content)
    const calls = functionCalls(message.toolCall)
    if (calls.length > 0 && !finished) void answer(calls)
  }

  function enqueue(step: () => Promise<void> | void) {
    inbox = inbox.then(step).catch(report)
  }

  function closeFromServer(code: number, reason: string) {
    if (code === 1008 || EXPIRED_HINT.test(reason)) finish('expired', reason || undefined)
    else if (status !== 'open' || code !== 1000) finish('error', reason || `${code}`)
    else finish('ended')
  }

  const session: LiveSession = {
    state: () => status,
    sendAudio(chunk) {
      if (status !== 'open' || chunk.length === 0) return
      send({ realtimeInput: { audio: { data: int16ToBase64(chunk), mimeType: AUDIO_MIME } } })
    },
    sendText(value) {
      if (status !== 'open' || !value) return
      send({ realtimeInput: { text: value } })
    },
    endAudio() {
      if (status !== 'open') return
      send({ realtimeInput: { audioStreamEnd: true } })
    },
    close() {
      if (finished) return
      finish('ended')
      socket?.close(1000)
    },
  }

  try {
    socket = (options.socket ?? browserSocket)(liveUrl(options.token))
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    queueMicrotask(() => finish('error', detail))
    return session
  }

  socket.onopen = () => send({ setup: { model: modelPath(options.model) } })
  socket.onmessage = (event) => {
    const data = event.data
    enqueue(async () => {
      const message = parse(await decode(data).catch(() => undefined))
      if (message) handle(message)
    })
  }
  socket.onclose = (event) => {
    const { code, reason } = event
    enqueue(() => closeFromServer(code, reason))
  }

  return session
}
