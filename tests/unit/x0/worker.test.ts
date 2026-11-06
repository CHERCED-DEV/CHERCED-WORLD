import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_ACTIVE_WORKERS,
  activeLabWorkers,
  createLabWorker,
  terminateLabWorkers,
  LabWorkerError,
  type LabVisibility,
  type LabWorkerHandle,
} from '@/lib/ailab/core/worker'
import { isLabWorkerInbound } from '@/lib/ailab/core/worker-protocol'
import { serveLabWorker, transfer, type LabTaskHandler, type LabWorkerScope } from '@/lib/ailab/core/worker-runtime'

type Fake = LabWorkerHandle & { posted: unknown[]; terminated: boolean; crash: () => void; stop: () => void }

function connect<In, Out, P>(handler: LabTaskHandler<In, Out, P>): Fake {
  const toWorker = new EventTarget()
  const toMain = new EventTarget()
  const scope: LabWorkerScope = {
    postMessage: (message) => queueMicrotask(() => toMain.dispatchEvent(new MessageEvent('message', { data: structuredClone(message) }))),
    addEventListener: (type, listener) => toWorker.addEventListener(type, listener as EventListener),
    removeEventListener: (type, listener) => toWorker.removeEventListener(type, listener as EventListener),
  }
  const stop = serveLabWorker(handler, scope)
  const fake: Fake = {
    posted: [],
    terminated: false,
    postMessage(message) {
      fake.posted.push(message)
      queueMicrotask(() => toWorker.dispatchEvent(new MessageEvent('message', { data: structuredClone(message) })))
    },
    terminate() {
      fake.terminated = true
      stop()
    },
    addEventListener: (type, listener) => toMain.addEventListener(type, listener),
    removeEventListener: (type, listener) => toMain.removeEventListener(type, listener),
    crash: () => toMain.dispatchEvent(new Event('error')),
    stop,
  }
  return fake
}

function visibility(): LabVisibility & { set: (hidden: boolean) => void; count: () => number } {
  const listeners = new Set<() => void>()
  let hidden = false
  return {
    get hidden() {
      return hidden
    },
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    set(next) {
      hidden = next
      for (const listener of listeners) listener()
    },
    count: () => listeners.size,
  }
}

const echo: LabTaskHandler<{ text: string }, string, number> = async ({ text }, context) => {
  context.progress(50)
  await context.checkpoint()
  context.progress(100)
  return text.toUpperCase()
}

afterEach(() => {
  terminateLabWorkers()
})

describe('createLabWorker (FR-330, R-706)', () => {
  it('manda mensajes con tipo, recibe el progreso y el resultado', async () => {
    const fake = connect(echo)
    const worker = createLabWorker<{ text: string }, string, number>(() => fake, { experiment: 'V1' }, { visibility: null })
    const progress: number[] = []
    await expect(worker.call({ text: 'hola' }, { onProgress: (value) => progress.push(value) })).resolves.toBe('HOLA')
    expect(progress).toEqual([50, 100])
    expect(fake.posted.every(isLabWorkerInbound)).toBe(true)
    expect(fake.posted[0]).toEqual({ cw: 'call', id: 1, payload: { text: 'hola' } })
  })

  it('cancela con AbortSignal: rechaza con AbortError y la tarea del worker se entera', async () => {
    let seen: AbortSignal | null = null
    const fake = connect<null, string, never>(async (_payload, context) => {
      seen = context.signal
      for (;;) {
        await context.checkpoint()
        await new Promise((resolve) => setTimeout(resolve, 1))
      }
    })
    const worker = createLabWorker<null, string>(() => fake, { experiment: 'A5' }, { visibility: null })
    const controller = new AbortController()
    const pending = worker.call(null, { signal: controller.signal })
    await vi.waitFor(() => expect(seen).not.toBeNull())
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    expect(fake.posted).toContainEqual({ cw: 'cancel', id: 1 })
    await vi.waitFor(() => expect((seen as AbortSignal | null)?.aborted).toBe(true))
  })

  it('una señal ya cancelada ni siquiera llega al worker', async () => {
    const fake = connect(echo)
    const worker = createLabWorker<{ text: string }, string, number>(() => fake, { experiment: 'V1' }, { visibility: null })
    await expect(worker.call({ text: 'x' }, { signal: AbortSignal.abort() })).rejects.toMatchObject({ name: 'AbortError' })
    expect(fake.posted).toEqual([])
  })

  it('se pausa con la pestaña oculta y retoma al volver', async () => {
    const view = visibility()
    const onPause = vi.fn()
    let steps = 0
    const fake = connect<null, number, never>(async (_payload, context) => {
      for (let i = 0; i < 5; i++) {
        await context.checkpoint()
        steps += 1
        await new Promise((resolve) => setTimeout(resolve, 2))
      }
      return steps
    })
    const worker = createLabWorker<null, number>(() => fake, { experiment: 'J1', onPause }, { visibility: view })
    const result = worker.call(null)
    await vi.waitFor(() => expect(steps).toBeGreaterThan(0))
    view.set(true)
    expect(worker.state).toBe('paused')
    expect(fake.posted).toContainEqual({ cw: 'pause' })
    const frozen = steps
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(steps).toBeLessThanOrEqual(frozen + 1)
    view.set(false)
    expect(worker.state).toBe('running')
    await expect(result).resolves.toBe(5)
    expect(onPause.mock.calls).toEqual([[true], [false]])
  })

  it('si nace con la pestaña oculta, nace en pausa', () => {
    const view = visibility()
    view.set(true)
    const fake = connect(echo)
    const worker = createLabWorker(() => fake, { experiment: 'V1' }, { visibility: view })
    expect(worker.state).toBe('paused')
    expect(fake.posted).toEqual([{ cw: 'pause' }])
  })

  it('como máximo dos vivos: el tercero desaloja al menos usado y le avisa', async () => {
    expect(MAX_ACTIVE_WORKERS).toBe(2)
    const evicted = vi.fn()
    const first = connect(echo)
    const a = createLabWorker<{ text: string }, string, number>(() => first, { experiment: 'V1', onEvict: evicted }, { visibility: null })
    const b = createLabWorker<{ text: string }, string, number>(() => connect(echo), { experiment: 'J1' }, { visibility: null })
    await a.call({ text: 'uso' })
    const c = createLabWorker<{ text: string }, string, number>(() => connect(echo), { experiment: 'A4' }, { visibility: null })
    expect(activeLabWorkers()).toEqual(['V1', 'A4'])
    expect(b.state).toBe('terminated')
    expect(evicted).not.toHaveBeenCalled()
    createLabWorker(() => connect(echo), { experiment: 'J2' }, { visibility: null })
    expect(activeLabWorkers()).toEqual(['A4', 'J2'])
    expect(evicted).toHaveBeenCalledOnce()
    expect(first.terminated).toBe(true)
    await expect(a.call({ text: 'tarde' })).rejects.toMatchObject({ reason: 'terminated' })
    await expect(c.call({ text: 'sigue' })).resolves.toBe('SIGUE')
  })

  it('desalojar rechaza lo pendiente con LabWorkerError("evicted")', async () => {
    const fake = connect<null, never, never>(() => new Promise<never>(() => {}))
    const a = createLabWorker<null, never>(() => fake, { experiment: 'V1' }, { visibility: null })
    const pending = a.call(null)
    createLabWorker(() => connect(echo), { experiment: 'J1' }, { visibility: null })
    createLabWorker(() => connect(echo), { experiment: 'J2' }, { visibility: null })
    await expect(pending).rejects.toBeInstanceOf(LabWorkerError)
    await expect(pending).rejects.toMatchObject({ reason: 'evicted' })
  })

  it('un solo worker por experimento: el nuevo reemplaza al anterior', () => {
    const old = connect(echo)
    const first = createLabWorker(() => old, { experiment: 'V1' }, { visibility: null })
    createLabWorker(() => connect(echo), { experiment: 'V1' }, { visibility: null })
    expect(first.state).toBe('terminated')
    expect(old.terminated).toBe(true)
    expect(activeLabWorkers()).toEqual(['V1'])
  })

  it('terminar libera el lugar, quita los listeners y rechaza lo pendiente', async () => {
    const view = visibility()
    const fake = connect<null, never, never>(() => new Promise<never>(() => {}))
    const worker = createLabWorker<null, never>(() => fake, { experiment: 'R1' }, { visibility: view })
    expect(view.count()).toBe(1)
    const pending = worker.call(null)
    worker.terminate()
    await expect(pending).rejects.toMatchObject({ reason: 'terminated' })
    expect(fake.terminated).toBe(true)
    expect(view.count()).toBe(0)
    expect(activeLabWorkers()).toEqual([])
    expect(terminateLabWorkers()).toBe(0)
  })

  it('si el worker se cae, rechaza con "crashed" y se libera', async () => {
    const fake = connect<null, never, never>(() => new Promise<never>(() => {}))
    const worker = createLabWorker<null, never>(() => fake, { experiment: 'V4' }, { visibility: null })
    const pending = worker.call(null)
    fake.crash()
    await expect(pending).rejects.toMatchObject({ reason: 'crashed' })
    expect(worker.state).toBe('terminated')
  })

  it('un error del worker llega con su nombre y su mensaje', async () => {
    const fake = connect<null, never, never>(async () => {
      throw new RangeError('audio de más de 10 minutos')
    })
    const worker = createLabWorker<null, never>(() => fake, { experiment: 'V1' }, { visibility: null })
    await expect(worker.call(null)).rejects.toMatchObject({ name: 'RangeError', message: 'audio de más de 10 minutos' })
  })

  it('con una URL usa spawn con el worker de módulo', () => {
    const spawn = vi.fn(() => connect(echo))
    createLabWorker(new URL('https://cherced.test/x.worker.js'), { experiment: 'A4' }, { visibility: null, spawn })
    expect(spawn).toHaveBeenCalledWith(new URL('https://cherced.test/x.worker.js'))
  })
})

describe('serveLabWorker', () => {
  it('devuelve buffers transferidos y deja de escuchar al soltarse', async () => {
    const posted: Array<{ message: unknown; list?: Transferable[] }> = []
    const target = new EventTarget()
    const scope: LabWorkerScope = {
      postMessage: (message, list) => posted.push({ message, list }),
      addEventListener: (type, listener) => target.addEventListener(type, listener as EventListener),
      removeEventListener: (type, listener) => target.removeEventListener(type, listener as EventListener),
    }
    const stop = serveLabWorker<null, ArrayBuffer>(() => {
      const buffer = new ArrayBuffer(8)
      return transfer(buffer, [buffer])
    }, scope)
    target.dispatchEvent(new MessageEvent('message', { data: { cw: 'call', id: 7, payload: null } }))
    await vi.waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]?.message).toMatchObject({ cw: 'result', id: 7 })
    expect(posted[0]?.list?.[0]).toBeInstanceOf(ArrayBuffer)
    stop()
    target.dispatchEvent(new MessageEvent('message', { data: { cw: 'call', id: 8, payload: null } }))
    target.dispatchEvent(new MessageEvent('message', { data: 'ruido' }))
    await new Promise((resolve) => setTimeout(resolve, 5))
    expect(posted).toHaveLength(1)
  })
})
