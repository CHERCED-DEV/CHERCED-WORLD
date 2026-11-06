import type { LabExperimentId } from '@/content/types'
import { abortError, isLabWorkerOutbound, type LabWorkerFault, type LabWorkerInbound } from './worker-protocol'

export const MAX_ACTIVE_WORKERS = 2

export type LabWorkerHandle = {
  postMessage(message: unknown, transfer?: Transferable[]): void
  terminate(): void
  addEventListener(type: 'message' | 'error', listener: (event: Event) => void): void
  removeEventListener(type: 'message' | 'error', listener: (event: Event) => void): void
}

export type LabWorkerSource = (() => LabWorkerHandle) | URL | string

export type LabVisibility = {
  readonly hidden: boolean
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}

export type LabWorkerEnv = {
  visibility?: LabVisibility | null
  spawn?: (source: URL | string) => LabWorkerHandle
}

export type LabWorkerOptions = {
  experiment: LabExperimentId
  onEvict?: () => void
  onPause?: (paused: boolean) => void
}

export type LabCallOptions<Progress> = {
  signal?: AbortSignal
  onProgress?: (progress: Progress) => void
  transfer?: Transferable[]
}

export type LabWorkerState = 'running' | 'paused' | 'terminated'

export type LabWorker<In, Out, Progress = never> = {
  readonly experiment: LabExperimentId
  readonly state: LabWorkerState
  call(payload: In, options?: LabCallOptions<Progress>): Promise<Out>
  terminate(): void
}

export type LabWorkerErrorReason = 'evicted' | 'terminated' | 'crashed'

export class LabWorkerError extends Error {
  readonly reason: LabWorkerErrorReason

  constructor(reason: LabWorkerErrorReason, experiment: LabExperimentId) {
    super(`El worker de ${experiment} terminó (${reason})`)
    this.name = 'LabWorkerError'
    this.reason = reason
  }
}

type Pending = {
  resolve: (value: never) => void
  reject: (reason: unknown) => void
  onProgress?: (progress: never) => void
  cleanup: () => void
}

type Entry = {
  experiment: LabExperimentId
  stop: (reason: LabWorkerErrorReason) => void
}

const active: Entry[] = []

function touch(entry: Entry): void {
  const index = active.indexOf(entry)
  if (index >= 0) active.splice(index, 1)
  active.push(entry)
}

function release(entry: Entry): void {
  const index = active.indexOf(entry)
  if (index >= 0) active.splice(index, 1)
}

function defaultVisibility(): LabVisibility | null {
  return typeof document === 'undefined' ? null : document
}

function defaultSpawn(source: URL | string): LabWorkerHandle {
  return new Worker(source, { type: 'module' })
}

function faultError(fault: LabWorkerFault): Error {
  if (fault.name === 'AbortError') return abortError(fault.message)
  const error = new Error(fault.message)
  error.name = fault.name
  return error
}

export function activeLabWorkers(): LabExperimentId[] {
  return active.map((entry) => entry.experiment)
}

export function terminateLabWorkers(experiment?: LabExperimentId): number {
  const targets = active.filter((entry) => experiment === undefined || entry.experiment === experiment)
  for (const entry of targets) entry.stop('terminated')
  return targets.length
}

export function createLabWorker<In, Out, Progress = never>(
  source: LabWorkerSource,
  options: LabWorkerOptions,
  env: LabWorkerEnv = {},
): LabWorker<In, Out, Progress> {
  const { experiment } = options
  for (const entry of active.filter((item) => item.experiment === experiment)) entry.stop('terminated')
  while (active.length >= MAX_ACTIVE_WORKERS) active[0]?.stop('evicted')

  const visibility = env.visibility === undefined ? defaultVisibility() : env.visibility
  const handle = typeof source === 'function' ? source() : (env.spawn ?? defaultSpawn)(source)
  const pending = new Map<number, Pending>()
  let nextId = 0
  let state: LabWorkerState = 'running'

  const post = (message: LabWorkerInbound<In>, transfer?: Transferable[]) => {
    if (transfer && transfer.length > 0) handle.postMessage(message, transfer)
    else handle.postMessage(message)
  }

  const settleAll = (error: unknown) => {
    for (const item of [...pending.values()]) {
      item.cleanup()
      item.reject(error)
    }
    pending.clear()
  }

  const onMessage = (event: Event) => {
    const data = (event as MessageEvent).data
    if (!isLabWorkerOutbound(data)) return
    const item = pending.get(data.id)
    if (!item) return
    if (data.cw === 'progress') {
      item.onProgress?.(data.payload as never)
      return
    }
    pending.delete(data.id)
    item.cleanup()
    if (data.cw === 'result') item.resolve(data.payload as never)
    else item.reject(faultError(data.error))
  }

  const onError = (event: Event) => {
    event.preventDefault?.()
    entry.stop('crashed')
  }

  const syncVisibility = () => {
    if (state === 'terminated' || !visibility) return
    const next: LabWorkerState = visibility.hidden ? 'paused' : 'running'
    if (next === state) return
    state = next
    post({ cw: next === 'paused' ? 'pause' : 'resume' })
    options.onPause?.(next === 'paused')
  }

  const entry: Entry = {
    experiment,
    stop(reason) {
      if (state === 'terminated') return
      state = 'terminated'
      release(entry)
      handle.removeEventListener('message', onMessage)
      handle.removeEventListener('error', onError)
      visibility?.removeEventListener('visibilitychange', syncVisibility)
      handle.terminate()
      settleAll(new LabWorkerError(reason, experiment))
      if (reason === 'evicted') options.onEvict?.()
    },
  }

  handle.addEventListener('message', onMessage)
  handle.addEventListener('error', onError)
  visibility?.addEventListener('visibilitychange', syncVisibility)
  active.push(entry)
  syncVisibility()

  return {
    experiment,
    get state() {
      return state
    },
    call(payload, callOptions = {}) {
      if (state === 'terminated') return Promise.reject(new LabWorkerError('terminated', experiment))
      const { signal, onProgress, transfer } = callOptions
      if (signal?.aborted) return Promise.reject(abortError())
      touch(entry)
      nextId += 1
      const id = nextId
      return new Promise<Out>((resolve, reject) => {
        const onAbort = () => {
          if (!pending.delete(id)) return
          post({ cw: 'cancel', id })
          reject(abortError())
        }
        signal?.addEventListener('abort', onAbort, { once: true })
        pending.set(id, {
          resolve: resolve as (value: never) => void,
          reject,
          onProgress: onProgress as ((progress: never) => void) | undefined,
          cleanup: () => signal?.removeEventListener('abort', onAbort),
        })
        post({ cw: 'call', id, payload }, transfer)
      })
    },
    terminate() {
      entry.stop('terminated')
    },
  }
}
