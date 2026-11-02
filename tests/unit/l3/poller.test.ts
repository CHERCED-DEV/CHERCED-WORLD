import { describe, expect, it } from 'vitest'
import {
  backoffDelay,
  createPoller,
  hasNewArrivals,
  MAX_BACKOFF_MS,
  POLL_INTERVAL_MS,
  readSnapshot,
  type Counts,
  type PollResponse,
  type PollStatus,
} from '@/components/admin/poller'

type Timer = { run: () => void; at: number; id: number }

function harness(initial: Counts = { unread: 0, pending: 0 }) {
  let clock = 0
  let nextId = 1
  let timers: Timer[] = []
  let visible = true
  const responses: Array<PollResponse | Error> = []
  const calls: Array<{ since: string; signal: AbortSignal }> = []
  const statuses: PollStatus[] = []
  const changes: Array<{ counts: Counts; previous: Counts }> = []
  let ended = 0
  let hold: ((value: PollResponse) => void) | null = null
  let holdNext = false

  const poller = createPoller(
    {
      fetchUpdates: (since, signal) => {
        calls.push({ since, signal })
        if (holdNext) {
          holdNext = false
          return new Promise<PollResponse>((resolve, reject) => {
            hold = resolve
            signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
          })
        }
        const next = responses.shift() ?? ok()
        return next instanceof Error ? Promise.reject(next) : Promise.resolve(next)
      },
      isVisible: () => visible,
      setTimer: (run, ms) => {
        const timer = { run, at: clock + ms, id: nextId++ }
        timers.push(timer)
        return timer.id
      },
      clearTimer: (id) => {
        timers = timers.filter((timer) => timer.id !== id)
      },
      onStatus: (status) => statuses.push(status),
      onChange: (counts, previous) => changes.push({ counts, previous }),
      onEnded: () => {
        ended += 1
      },
    },
    { since: '2026-11-02T10:00:00.000Z', ...initial },
  )

  async function advance(ms: number) {
    const target = clock + ms
    for (;;) {
      const due = timers.filter((timer) => timer.at <= target).sort((a, b) => a.at - b.at)[0]
      if (!due) break
      clock = due.at
      timers = timers.filter((timer) => timer !== due)
      due.run()
      await flush()
    }
    clock = target
  }

  return {
    poller,
    responses,
    calls,
    statuses,
    changes,
    advance,
    get ended() {
      return ended
    },
    get pendingTimers() {
      return timers.map((timer) => timer.at - clock)
    },
    setVisible(value: boolean) {
      visible = value
      poller.visibilityChanged()
    },
    holdNextRequest() {
      holdNext = true
    },
    release(value: PollResponse) {
      hold?.(value)
    },
  }
}

async function flush() {
  for (let i = 0; i < 5; i++) await Promise.resolve()
}

function ok(body: Partial<{ now: string; unread: number; pending: number; messages: unknown[]; comments: unknown[] }> = {}): PollResponse {
  return {
    status: 200,
    body: { now: '2026-11-02T10:00:05.000Z', unread: 0, pending: 0, messages: [], comments: [], ...body },
  }
}

const change = (id: string, updatedAt = '2026-11-02T10:00:04.000Z') => ({ id, updatedAt })

describe('backoff', () => {
  it('va de 5 s a 30 s y se queda en 30 s', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(backoffDelay)).toEqual([5000, 5000, 10_000, 20_000, 30_000, 30_000, 30_000])
    expect(POLL_INTERVAL_MS).toBe(5000)
    expect(MAX_BACKOFF_MS).toBe(30_000)
  })
})

describe('readSnapshot', () => {
  it('acepta la respuesta del contrato y descarta lo que no la cumple', () => {
    expect(readSnapshot(ok({ messages: [change('a')] }).body)).toMatchObject({ unread: 0, pending: 0, keys: ['m:a:2026-11-02T10:00:04.000Z'] })
    expect(readSnapshot(null)).toBeNull()
    expect(readSnapshot({ error: 'unauthorized' })).toBeNull()
    expect(readSnapshot({ ...(ok().body as object), now: 'ayer' })).toBeNull()
    expect(readSnapshot({ ...(ok().body as object), unread: -1 })).toBeNull()
    expect(readSnapshot({ ...(ok().body as object), messages: [{ id: 1 }] })).toBeNull()
  })
})

describe('createPoller', () => {
  it('pregunta cada 5 s con la hora del servidor de la respuesta anterior', async () => {
    const h = harness()
    h.poller.start()
    await h.advance(4999)
    expect(h.calls).toHaveLength(0)
    await h.advance(1)
    expect(h.calls.map((call) => call.since)).toEqual(['2026-11-02T10:00:00.000Z'])
    h.responses.push(ok({ now: '2026-11-02T10:00:10.000Z' }))
    await h.advance(5000)
    await h.advance(5000)
    expect(h.calls.map((call) => call.since)).toEqual([
      '2026-11-02T10:00:00.000Z',
      '2026-11-02T10:00:05.000Z',
      '2026-11-02T10:00:10.000Z',
    ])
  })

  it('avisa cuando hay registros nuevos o cambian los contadores, una sola vez por cambio', async () => {
    const h = harness({ unread: 1, pending: 0 })
    h.poller.start()
    h.responses.push(
      ok({ unread: 1 }),
      ok({ unread: 2, messages: [change('m1')] }),
      ok({ unread: 2, messages: [change('m1')] }),
      ok({ unread: 2, pending: 1, comments: [change('c1')] }),
      ok({ unread: 1, pending: 1 }),
    )
    await h.advance(25_000)
    expect(h.changes).toEqual([
      { counts: { unread: 2, pending: 0 }, previous: { unread: 1, pending: 0 } },
      { counts: { unread: 2, pending: 1 }, previous: { unread: 2, pending: 0 } },
      { counts: { unread: 1, pending: 1 }, previous: { unread: 2, pending: 1 } },
    ])
    expect(h.changes.map(({ counts, previous }) => hasNewArrivals(counts, previous))).toEqual([true, true, false])
  })

  it('un mismo registro editado otra vez cuenta como cambio', async () => {
    const h = harness()
    h.poller.start()
    h.responses.push(ok({ comments: [change('c1', 'a')] }), ok({ comments: [change('c1', 'b')] }))
    await h.advance(10_000)
    expect(h.changes).toHaveLength(2)
  })

  it('si falla muestra "reconectando", reintenta con backoff y vuelve a "en vivo"', async () => {
    const h = harness()
    h.poller.start()
    h.responses.push(new TypeError('offline'), { status: 503, body: null }, new TypeError('offline'), new TypeError('offline'), new TypeError('offline'))
    await h.advance(5000)
    expect(h.statuses).toEqual(['reconnecting'])
    expect(h.pendingTimers).toEqual([5000])
    await h.advance(5000)
    expect(h.pendingTimers).toEqual([10_000])
    await h.advance(10_000)
    expect(h.pendingTimers).toEqual([20_000])
    await h.advance(20_000)
    expect(h.pendingTimers).toEqual([30_000])
    await h.advance(30_000)
    expect(h.pendingTimers).toEqual([30_000])
    await h.advance(30_000)
    expect(h.statuses).toEqual(['reconnecting', 'live'])
    expect(h.pendingTimers).toEqual([5000])
    expect(h.calls).toHaveLength(6)
  })

  it('una respuesta que no cumple el contrato cuenta como falla', async () => {
    const h = harness()
    h.poller.start()
    h.responses.push({ status: 200, body: { now: 'x' } })
    await h.advance(5000)
    expect(h.statuses).toEqual(['reconnecting'])
  })

  it('con 401 termina, avisa una vez y deja de preguntar', async () => {
    const h = harness()
    h.poller.start()
    h.responses.push({ status: 401, body: null })
    await h.advance(5000)
    expect(h.statuses).toEqual(['ended'])
    expect(h.ended).toBe(1)
    expect(h.pendingTimers).toEqual([])
    h.setVisible(false)
    h.setVisible(true)
    h.poller.start()
    h.poller.pollNow()
    await h.advance(60_000)
    expect(h.calls).toHaveLength(1)
  })

  it('con la pestaña oculta no pregunta; al volver pregunta de inmediato', async () => {
    const h = harness()
    h.poller.start()
    await h.advance(5000)
    h.setVisible(false)
    expect(h.pendingTimers).toEqual([])
    await h.advance(60_000)
    expect(h.calls).toHaveLength(1)
    h.setVisible(true)
    await flush()
    expect(h.calls).toHaveLength(2)
    expect(h.pendingTimers).toEqual([5000])
  })

  it('ocultar la pestaña cancela la petición en curso sin contarla como falla', async () => {
    const h = harness()
    h.poller.start()
    h.holdNextRequest()
    await h.advance(5000)
    const [first] = h.calls
    h.setVisible(false)
    await flush()
    expect(first?.signal.aborted).toBe(true)
    expect(h.statuses).toEqual([])
    expect(h.pendingTimers).toEqual([])
  })

  it('arranca oculta sin preguntar y empieza al hacerse visible', async () => {
    const h = harness()
    h.setVisible(false)
    h.poller.start()
    await h.advance(30_000)
    expect(h.calls).toHaveLength(0)
    h.setVisible(true)
    await flush()
    expect(h.calls).toHaveLength(1)
  })

  it('stop cancela todo y una respuesta tardía no hace nada', async () => {
    const h = harness()
    h.poller.start()
    h.holdNextRequest()
    await h.advance(5000)
    h.poller.stop()
    h.release(ok({ unread: 3 }))
    await flush()
    expect(h.changes).toEqual([])
    expect(h.pendingTimers).toEqual([])
    await h.advance(60_000)
    expect(h.calls).toHaveLength(1)
  })

  it('al volver la red pregunta de inmediato', async () => {
    const h = harness()
    h.poller.start()
    h.responses.push(new TypeError('offline'))
    await h.advance(5000)
    expect(h.statuses).toEqual(['reconnecting'])
    h.poller.pollNow()
    await flush()
    expect(h.calls).toHaveLength(2)
    expect(h.statuses).toEqual(['reconnecting', 'live'])
  })
})
