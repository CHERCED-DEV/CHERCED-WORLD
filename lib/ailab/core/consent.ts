import { LAB_HOSTS, isLabExperimentId, type LabDownload, type LabExperimentId, type LabHost } from '@/content/types'

export const CONSENT_STORAGE_KEY = 'cw-ailab-consent'

export type DownloadRequest = { experiment: LabExperimentId; resource: string; bytes: number; host: LabHost }

export type ConsentPresenter = (request: DownloadRequest) => Promise<boolean>

export type ConsentStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

type Listener = () => void

let presenter: ConsentPresenter | null = null

let queue: Promise<unknown> = Promise.resolve()

const pending = new Map<string, Promise<boolean>>()

const listeners = new Set<Listener>()

let memory: string[] = []

let storageOverride: ConsentStorage | null | undefined

export function consentKey(experiment: LabExperimentId, resource: string): string {
  return `${experiment}:${resource}`
}

export function toDownloadRequest(experiment: LabExperimentId, download: LabDownload): DownloadRequest {
  return { experiment, resource: download.resource, bytes: download.bytes, host: download.host }
}

export function assertDownloadRequest(request: DownloadRequest): void {
  if (!isLabExperimentId(request.experiment)) throw new TypeError(`requestDownload: experimento desconocido "${String(request.experiment)}"`)
  if (typeof request.resource !== 'string' || request.resource.trim() === '') throw new TypeError('requestDownload: falta el recurso')
  if (!Number.isInteger(request.bytes) || request.bytes <= 0) throw new TypeError(`requestDownload: el peso de ${request.resource} debe ser un entero positivo`)
  if (!(LAB_HOSTS as readonly string[]).includes(request.host)) throw new TypeError(`requestDownload: servidor no permitido "${String(request.host)}"`)
}

export function setConsentStorage(storage: ConsentStorage | null | undefined): void {
  storageOverride = storage
  memory = []
}

function storage(): ConsentStorage | null {
  if (storageOverride !== undefined) return storageOverride
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage
  } catch {
    return null
  }
}

function read(): string[] {
  const store = storage()
  if (!store) return memory
  try {
    const raw = store.getItem(CONSENT_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return memory
  }
}

function write(keys: string[]): void {
  memory = keys
  const store = storage()
  if (store) {
    try {
      if (keys.length === 0) store.removeItem(CONSENT_STORAGE_KEY)
      else store.setItem(CONSENT_STORAGE_KEY, JSON.stringify(keys))
    } catch {}
  }
  for (const listener of listeners) listener()
}

export function consentedKeys(): string[] {
  return [...read()]
}

export function hasConsent(experiment: LabExperimentId, resource: string): boolean {
  return read().includes(consentKey(experiment, resource))
}

export function consentedResources(experiment: LabExperimentId): string[] {
  const prefix = `${experiment}:`
  return read()
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length))
}

export function grantConsent(experiment: LabExperimentId, resource: string): void {
  const key = consentKey(experiment, resource)
  const keys = read()
  if (!keys.includes(key)) write([...keys, key])
}

export function withdrawConsent(experiment: LabExperimentId, resource?: string): void {
  const keys = read()
  const next = keys.filter((key) => (resource === undefined ? !key.startsWith(`${experiment}:`) : key !== consentKey(experiment, resource)))
  if (next.length !== keys.length) write(next)
}

export function clearConsent(): void {
  write([])
}

export function onConsentChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function setConsentPresenter(next: ConsentPresenter): () => void {
  presenter = next
  return () => {
    if (presenter === next) presenter = null
  }
}

export function hasConsentPresenter(): boolean {
  return presenter !== null
}

async function ask(request: DownloadRequest): Promise<boolean> {
  if (hasConsent(request.experiment, request.resource)) return true
  const present = presenter
  if (!present) return false
  let accepted = false
  try {
    accepted = (await present(request)) === true
  } catch {
    accepted = false
  }
  if (accepted) grantConsent(request.experiment, request.resource)
  return accepted
}

export function requestDownload(request: DownloadRequest): Promise<boolean> {
  assertDownloadRequest(request)
  if (hasConsent(request.experiment, request.resource)) return Promise.resolve(true)
  const key = consentKey(request.experiment, request.resource)
  const existing = pending.get(key)
  if (existing) return existing
  const turn = queue.then(() => ask(request))
  queue = turn.catch(() => false)
  const result = turn.finally(() => pending.delete(key))
  pending.set(key, result)
  return result
}
