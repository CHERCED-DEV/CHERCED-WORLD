export type LabWorkerFault = { name: string; message: string }

export type LabWorkerInbound<In> =
  | { cw: 'call'; id: number; payload: In }
  | { cw: 'cancel'; id: number }
  | { cw: 'pause' }
  | { cw: 'resume' }

export type LabWorkerOutbound<Out, Progress> =
  | { cw: 'progress'; id: number; payload: Progress }
  | { cw: 'result'; id: number; payload: Out }
  | { cw: 'error'; id: number; error: LabWorkerFault }

const INBOUND = new Set(['call', 'cancel', 'pause', 'resume'])

const OUTBOUND = new Set(['progress', 'result', 'error'])

function kind(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const value = (data as { cw?: unknown }).cw
  return typeof value === 'string' ? value : null
}

export function isLabWorkerInbound(data: unknown): data is LabWorkerInbound<unknown> {
  const type = kind(data)
  return type !== null && INBOUND.has(type)
}

export function isLabWorkerOutbound(data: unknown): data is LabWorkerOutbound<unknown, unknown> {
  const type = kind(data)
  return type !== null && OUTBOUND.has(type) && typeof (data as { id?: unknown }).id === 'number'
}

export function abortError(message = 'La tarea se canceló'): DOMException {
  return new DOMException(message, 'AbortError')
}

export function toFault(error: unknown): LabWorkerFault {
  if (error instanceof DOMException || error instanceof Error) return { name: error.name, message: error.message }
  return { name: 'Error', message: String(error) }
}
