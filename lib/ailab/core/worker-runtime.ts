import { abortError, isLabWorkerInbound, toFault, type LabWorkerOutbound } from './worker-protocol'

export type LabWorkerScope = {
  postMessage(message: unknown, transfer?: Transferable[]): void
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void
}

export type LabTaskContext<Progress> = {
  readonly signal: AbortSignal
  readonly paused: boolean
  progress(payload: Progress, transfer?: Transferable[]): void
  checkpoint(): Promise<void>
}

const TRANSFER = Symbol('cw-ailab-transfer')

export type Transferred<T> = { [TRANSFER]: true; value: T; list: Transferable[] }

export function transfer<T>(value: T, list: Transferable[]): Transferred<T> {
  return { [TRANSFER]: true, value, list }
}

function isTransferred<T>(value: T | Transferred<T>): value is Transferred<T> {
  return Boolean(value && typeof value === 'object' && TRANSFER in value)
}

export type LabTaskHandler<In, Out, Progress> = (
  payload: In,
  context: LabTaskContext<Progress>,
) => Out | Transferred<Out> | Promise<Out | Transferred<Out>>

function workerScope(): LabWorkerScope {
  if (typeof self === 'undefined') throw new Error('serveLabWorker solo corre dentro de un worker')
  return self as unknown as LabWorkerScope
}

export function serveLabWorker<In, Out, Progress = never>(
  handler: LabTaskHandler<In, Out, Progress>,
  scope: LabWorkerScope = workerScope(),
): () => void {
  const tasks = new Map<number, AbortController>()
  let paused = false
  let waiters: Array<() => void> = []

  const send = (message: LabWorkerOutbound<Out, Progress>, list?: Transferable[]) => {
    if (list && list.length > 0) scope.postMessage(message, list)
    else scope.postMessage(message)
  }

  const wake = () => {
    const current = waiters
    waiters = []
    for (const resolve of current) resolve()
  }

  const start = async (id: number, payload: In) => {
    const controller = new AbortController()
    tasks.set(id, controller)
    const { signal } = controller
    const context: LabTaskContext<Progress> = {
      signal,
      get paused() {
        return paused
      },
      progress(value, list) {
        if (!signal.aborted) send({ cw: 'progress', id, payload: value }, list)
      },
      async checkpoint() {
        if (signal.aborted) throw abortError()
        while (paused) {
          await new Promise<void>((resolve) => {
            const done = () => {
              signal.removeEventListener('abort', done)
              resolve()
            }
            waiters.push(done)
            signal.addEventListener('abort', done, { once: true })
          })
          if (signal.aborted) throw abortError()
        }
      },
    }
    try {
      const output = await handler(payload, context)
      if (signal.aborted) throw abortError()
      if (isTransferred(output)) send({ cw: 'result', id, payload: output.value }, output.list)
      else send({ cw: 'result', id, payload: output })
    } catch (error) {
      send({ cw: 'error', id, error: signal.aborted ? toFault(abortError()) : toFault(error) })
    } finally {
      tasks.delete(id)
    }
  }

  const onMessage = (event: MessageEvent) => {
    const data: unknown = event.data
    if (!isLabWorkerInbound(data)) return
    if (data.cw === 'call') void start(data.id, data.payload as In)
    else if (data.cw === 'cancel') tasks.get(data.id)?.abort()
    else if (data.cw === 'pause') paused = true
    else {
      paused = false
      wake()
    }
  }

  scope.addEventListener('message', onMessage)
  return () => {
    scope.removeEventListener('message', onMessage)
    for (const controller of tasks.values()) controller.abort()
    tasks.clear()
    paused = false
    wake()
  }
}
