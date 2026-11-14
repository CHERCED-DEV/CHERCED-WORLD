import { describe, expect, it, vi } from 'vitest'
import {
  LIVE_WS_URL,
  liveUrl,
  openLiveSession,
  type LiveEvents,
  type LiveFunctionResponse,
  type WebSocketLike,
} from '@/lib/ai/agent/live'
import { int16ToBase64 } from '@/lib/ai/agent/pcm'

type Json = Record<string, unknown>

class FakeSocket implements WebSocketLike {
  readyState = 0
  binaryType = 'blob'
  sent: Json[] = []
  closes: Array<{ code?: number; reason?: string }> = []
  onopen: ((event: unknown) => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { code: number; reason: string }) => void) | null = null
  onerror: ((event: unknown) => void) | null = null

  constructor(readonly url: string) {}

  send(data: string) {
    this.sent.push(JSON.parse(data) as Json)
  }

  close(code?: number, reason?: string) {
    this.closes.push({ code, reason })
    this.readyState = 2
  }

  open() {
    this.readyState = 1
    this.onopen?.({})
  }

  receive(data: unknown) {
    this.onmessage?.({ data })
  }

  json(payload: unknown) {
    this.receive(JSON.stringify(payload))
  }

  drop(code: number, reason = '') {
    this.readyState = 3
    this.onclose?.({ code, reason })
  }

  fail() {
    this.onerror?.({})
  }

  toolResponses() {
    return this.sent.filter((message) => 'toolResponse' in message)
  }
}

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function start(events: LiveEvents = {}, model = 'gemini-live-prueba') {
  const sockets: FakeSocket[] = []
  const session = openLiveSession({
    token: 'token-efimero',
    model,
    events,
    socket: (url) => {
      const socket = new FakeSocket(url)
      sockets.push(socket)
      return socket
    },
  })
  const socket = sockets[0]
  if (!socket) throw new Error('no se creó el socket')
  return { session, socket }
}

async function ready(events: LiveEvents = {}) {
  const started = start(events)
  started.socket.open()
  started.socket.json({ setupComplete: {} })
  await flush()
  return started
}

const toolCall = {
  toolCall: {
    functionCalls: [
      { id: 'llamada-1', name: 'buscar_post', args: { query: 'gates' } },
      { id: 'llamada-2', name: 'abrir_seccion', args: { id: 'blog' } },
    ],
  },
}

describe('live', () => {
  it('liveUrl codifica el token', () => {
    expect(liveUrl('a b/+=?&')).toBe(`${LIVE_WS_URL}?access_token=a%20b%2F%2B%3D%3F%26`)
  })

  it('conecta a la URL del token y envía setup con el prefijo models/', () => {
    const { socket } = start({}, 'gemini-live-prueba')
    expect(socket.url).toBe(liveUrl('token-efimero'))
    socket.open()
    expect(socket.sent).toEqual([{ setup: { model: 'models/gemini-live-prueba' } }])
  })

  it('no duplica el prefijo models/', () => {
    const { socket } = start({}, 'models/gemini-live-prueba')
    socket.open()
    expect(socket.sent).toEqual([{ setup: { model: 'models/gemini-live-prueba' } }])
  })

  it('setupComplete dispara onOpen y deja el estado en open', async () => {
    const onOpen = vi.fn()
    const { session, socket } = start({ onOpen })
    expect(session.state()).toBe('connecting')
    socket.open()
    expect(session.state()).toBe('connecting')
    socket.json({ setupComplete: {} })
    await flush()
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(session.state()).toBe('open')
  })

  it('un solo mensaje con audio, ambas transcripciones y turnComplete dispara todos los callbacks', async () => {
    const onAudio = vi.fn()
    const onInputTranscript = vi.fn()
    const onOutputTranscript = vi.fn()
    const onTurnComplete = vi.fn()
    const onInterrupted = vi.fn()
    const { socket } = await ready({ onAudio, onInputTranscript, onOutputTranscript, onTurnComplete, onInterrupted })
    socket.json({
      serverContent: {
        modelTurn: {
          parts: [
            { text: 'pensando' },
            { inlineData: { mimeType: 'audio/pcm;rate=24000', data: int16ToBase64(Int16Array.from([1, -2, 300])) } },
            { inlineData: { mimeType: 'image/png', data: int16ToBase64(Int16Array.from([9])) } },
            { inlineData: { mimeType: 'audio/pcm', data: int16ToBase64(Int16Array.from([-32768])) } },
          ],
        },
        inputTranscription: { text: 'hola' },
        outputTranscription: { text: 'buenas' },
        turnComplete: true,
        generationComplete: true,
      },
    })
    await flush()
    expect(onAudio).toHaveBeenCalledTimes(2)
    expect(Array.from(onAudio.mock.calls[0][0] as Int16Array)).toEqual([1, -2, 300])
    expect(Array.from(onAudio.mock.calls[1][0] as Int16Array)).toEqual([-32768])
    expect(onInputTranscript).toHaveBeenCalledWith('hola')
    expect(onOutputTranscript).toHaveBeenCalledWith('buenas')
    expect(onTurnComplete).toHaveBeenCalledTimes(1)
    expect(onInterrupted).not.toHaveBeenCalled()
  })

  it('interrupted dispara onInterrupted', async () => {
    const onInterrupted = vi.fn()
    const onTurnComplete = vi.fn()
    const { socket } = await ready({ onInterrupted, onTurnComplete })
    socket.json({ serverContent: { interrupted: true } })
    await flush()
    expect(onInterrupted).toHaveBeenCalledTimes(1)
    expect(onTurnComplete).not.toHaveBeenCalled()
  })

  it('decodifica frames ArrayBuffer', async () => {
    const onOpen = vi.fn()
    const onOutputTranscript = vi.fn()
    const { socket } = start({ onOpen, onOutputTranscript })
    socket.open()
    socket.receive(new TextEncoder().encode(JSON.stringify({ setupComplete: {} })).buffer)
    socket.receive(new TextEncoder().encode(JSON.stringify({ serverContent: { outputTranscription: { text: 'ñandú' } } })).buffer)
    await flush()
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOutputTranscript).toHaveBeenCalledWith('ñandú')
  })

  it('decodifica frames Blob en orden', async () => {
    const onOpen = vi.fn()
    const onInputTranscript = vi.fn()
    const { session, socket } = start({ onOpen, onInputTranscript })
    socket.open()
    socket.receive(new Blob([JSON.stringify({ setupComplete: {} })]))
    socket.json({ serverContent: { inputTranscription: { text: 'después' } } })
    await vi.waitFor(() => expect(onInputTranscript).toHaveBeenCalledWith('después'))
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen.mock.invocationCallOrder[0]).toBeLessThan(onInputTranscript.mock.invocationCallOrder[0])
    expect(session.state()).toBe('open')
  })

  it('ignora frames que no se pueden leer', async () => {
    const onOpen = vi.fn()
    const { session, socket } = start({ onOpen })
    socket.open()
    socket.receive('esto no es json')
    socket.receive(42)
    socket.json([1, 2, 3])
    socket.json({ setupComplete: {} })
    await flush()
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(session.state()).toBe('open')
  })

  it('toolCall envía el resultado del handler como toolResponse con los mismos ids', async () => {
    const onToolCall = vi.fn(async (calls: Array<{ id: string; name: string }>) =>
      calls.map(({ id, name }) => ({ id, name, response: { ok: true, id } })),
    )
    const { socket } = await ready({ onToolCall })
    socket.json(toolCall)
    await flush()
    expect(onToolCall).toHaveBeenCalledWith([
      { id: 'llamada-1', name: 'buscar_post', args: { query: 'gates' } },
      { id: 'llamada-2', name: 'abrir_seccion', args: { id: 'blog' } },
    ])
    expect(socket.toolResponses()).toEqual([
      {
        toolResponse: {
          functionResponses: [
            { id: 'llamada-1', name: 'buscar_post', response: { ok: true, id: 'llamada-1' } },
            { id: 'llamada-2', name: 'abrir_seccion', response: { ok: true, id: 'llamada-2' } },
          ],
        },
      },
    ])
  })

  it('un handler que falla responde { error: "failed" }', async () => {
    const onToolCall = vi.fn(async () => {
      throw new Error('boom')
    })
    const { socket } = await ready({ onToolCall })
    socket.json(toolCall)
    await flush()
    expect(socket.toolResponses()).toEqual([
      {
        toolResponse: {
          functionResponses: [
            { id: 'llamada-1', name: 'buscar_post', response: { error: 'failed' } },
            { id: 'llamada-2', name: 'abrir_seccion', response: { error: 'failed' } },
          ],
        },
      },
    ])
  })

  it('sin handler responde { error: "unsupported" }', async () => {
    const { socket } = await ready()
    socket.json(toolCall)
    await flush()
    expect(socket.toolResponses()).toEqual([
      {
        toolResponse: {
          functionResponses: [
            { id: 'llamada-1', name: 'buscar_post', response: { error: 'unsupported' } },
            { id: 'llamada-2', name: 'abrir_seccion', response: { error: 'unsupported' } },
          ],
        },
      },
    ])
  })

  it('no envía toolResponse si la sesión se cerró mientras corría el handler', async () => {
    const pending: Array<(responses: LiveFunctionResponse[]) => void> = []
    const onToolCall = vi.fn(() => new Promise<LiveFunctionResponse[]>((resolve) => pending.push(resolve)))
    const { session, socket } = await ready({ onToolCall })
    socket.json(toolCall)
    await flush()
    expect(onToolCall).toHaveBeenCalledTimes(1)
    session.close()
    pending[0]?.([{ id: 'llamada-1', name: 'buscar_post', response: { ok: true } }])
    await flush()
    expect(socket.toolResponses()).toEqual([])
  })

  it('ignora toolCallCancellation y goAway', async () => {
    const onClose = vi.fn()
    const { session, socket } = await ready({ onClose })
    socket.json({ toolCallCancellation: { ids: ['llamada-1'] } })
    socket.json({ goAway: { timeLeft: '10s' } })
    await flush()
    expect(onClose).not.toHaveBeenCalled()
    expect(session.state()).toBe('open')
    expect(socket.sent).toHaveLength(1)
  })

  it('sendAudio se ignora antes de open y después envía PCM en base64 con el mimeType correcto', async () => {
    const { session, socket } = start()
    session.sendAudio(Int16Array.from([1, 2, 3]))
    session.sendText('antes')
    session.endAudio()
    socket.open()
    session.sendAudio(Int16Array.from([1, 2, 3]))
    expect(socket.sent).toEqual([{ setup: { model: 'models/gemini-live-prueba' } }])
    socket.json({ setupComplete: {} })
    await flush()
    const chunk = Int16Array.from([0, -1, 32767, -32768])
    session.sendAudio(chunk)
    session.sendText('hola')
    session.endAudio()
    expect(socket.sent.slice(1)).toEqual([
      { realtimeInput: { audio: { data: int16ToBase64(chunk), mimeType: 'audio/pcm;rate=16000' } } },
      { realtimeInput: { text: 'hola' } },
      { realtimeInput: { audioStreamEnd: true } },
    ])
  })

  it('close() avisa onClose("ended") una sola vez aunque luego llegue el onclose del socket', async () => {
    const onClose = vi.fn()
    const onAudio = vi.fn()
    const { session, socket } = await ready({ onClose, onAudio })
    session.close()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith('ended')
    expect(session.state()).toBe('closed')
    expect(socket.closes).toHaveLength(1)
    socket.json({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm', data: 'AQA=' } }] } } })
    socket.drop(1006, 'abnormal')
    session.close()
    session.sendAudio(Int16Array.from([1]))
    await flush()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onAudio).not.toHaveBeenCalled()
    expect(socket.closes).toHaveLength(1)
  })

  it('un cierre 1008 del servidor es "expired" con la razón como detalle', async () => {
    const onClose = vi.fn()
    const { session, socket } = await ready({ onClose })
    socket.drop(1008, 'Policy violation')
    await flush()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith('expired', 'Policy violation')
    expect(session.state()).toBe('closed')
  })

  it('una razón que menciona deadline o token es "expired" aunque el código no sea 1008', async () => {
    const onClose = vi.fn()
    const { socket } = await ready({ onClose })
    socket.drop(1011, 'Deadline expired before operation could complete.')
    await flush()
    expect(onClose).toHaveBeenCalledWith('expired', 'Deadline expired before operation could complete.')
  })

  it('un cierre antes de open es "error"', async () => {
    const onClose = vi.fn()
    const onOpen = vi.fn()
    const { session, socket } = start({ onClose, onOpen })
    socket.open()
    socket.drop(1000, '')
    await flush()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0]).toBe('error')
    expect(onOpen).not.toHaveBeenCalled()
    expect(session.state()).toBe('closed')
  })

  it('un cierre 1000 después de open es "ended" y otro código es "error"', async () => {
    const ended = vi.fn()
    const first = await ready({ onClose: ended })
    first.socket.drop(1000, '')
    await flush()
    expect(ended).toHaveBeenCalledWith('ended')
    const failed = vi.fn()
    const second = await ready({ onClose: failed })
    second.socket.drop(1011, 'Internal error')
    await flush()
    expect(failed).toHaveBeenCalledWith('error', 'Internal error')
  })

  it('onerror solo no llama onClose; el cierre que sigue sí, una vez', async () => {
    const onClose = vi.fn()
    const { socket } = await ready({ onClose })
    socket.fail()
    await flush()
    expect(onClose).not.toHaveBeenCalled()
    socket.drop(1006, '')
    socket.drop(1006, '')
    await flush()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose.mock.calls[0][0]).toBe('error')
  })

  it('si no se puede crear el socket avisa onClose("error")', async () => {
    const onClose = vi.fn()
    const session = openLiveSession({
      token: 't',
      model: 'm',
      events: { onClose },
      socket: () => {
        throw new Error('URL inválida')
      },
    })
    await flush()
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith('error', 'URL inválida')
    expect(session.state()).toBe('closed')
  })
})
