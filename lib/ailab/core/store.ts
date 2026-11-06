import { clearConsent } from './consent'

export const LAB_DB_NAME = 'cw-ailab'

export const LAB_DB_VERSION = 1

export const LAB_DB_STORE = 'games'

export const LAB_CACHE_PREFIXES = ['transformers-cache', 'cw-ailab'] as const

const DELETE_TIMEOUT_MS = 3000

export type LabStorageEnv = {
  indexedDB?: IDBFactory | null
  caches?: Pick<CacheStorage, 'keys' | 'delete'> | null
}

export type LabStoreGetOptions = { version?: number }

export type ClearResult = { database: boolean; caches: string[]; complete: boolean }

type Listener = (result: ClearResult) => void

let envOverride: LabStorageEnv | undefined

let connection: Promise<IDBDatabase | null> | null = null

let memory = new Map<string, unknown>()

const listeners = new Set<Listener>()

export function setLabStorageEnv(env: LabStorageEnv | undefined): void {
  envOverride = env
  connection = null
  memory = new Map()
}

function env(): LabStorageEnv {
  if (envOverride) return envOverride
  const scope = globalThis as { indexedDB?: IDBFactory; caches?: CacheStorage }
  let indexedDB: IDBFactory | null = null
  let caches: CacheStorage | null = null
  try {
    indexedDB = scope.indexedDB ?? null
  } catch {}
  try {
    caches = scope.caches ?? null
  } catch {}
  return { indexedDB, caches }
}

function settle<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB falló'))
  })
}

function open(): Promise<IDBDatabase | null> {
  if (connection) return connection
  const factory = env().indexedDB
  if (!factory) {
    connection = Promise.resolve(null)
    return connection
  }
  connection = new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest
    try {
      request = factory.open(LAB_DB_NAME, LAB_DB_VERSION)
    } catch {
      resolve(null)
      return
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(LAB_DB_STORE)) db.createObjectStore(LAB_DB_STORE)
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        connection = null
      }
      resolve(db)
    }
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
  return connection
}

async function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  const db = await open()
  if (!db) return { ok: false }
  try {
    const store = db.transaction(LAB_DB_STORE, mode).objectStore(LAB_DB_STORE)
    return { ok: true, value: await settle(work(store)) }
  } catch {
    return { ok: false }
  }
}

function versionOf(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined
  const version = (value as { version?: unknown }).version
  return typeof version === 'number' ? version : undefined
}

export const labStore = {
  async get<T = unknown>(key: string, options: LabStoreGetOptions = {}): Promise<T | null> {
    const found = await run('readonly', (store) => store.get(key))
    const value = found.ok ? found.value : memory.get(key)
    if (value === undefined || value === null) return null
    if (options.version !== undefined && versionOf(value) !== options.version) {
      await labStore.delete(key)
      return null
    }
    return value as T
  },

  async set(key: string, value: unknown): Promise<boolean> {
    const saved = await run('readwrite', (store) => store.put(value, key))
    if (saved.ok) {
      memory.delete(key)
      return true
    }
    memory.set(key, value)
    return false
  },

  async delete(key: string): Promise<void> {
    memory.delete(key)
    await run('readwrite', (store) => store.delete(key))
  },

  async clear(): Promise<void> {
    memory.clear()
    await run('readwrite', (store) => store.clear())
  },

  async persistent(): Promise<boolean> {
    return (await open()) !== null
  },
}

function deleteDatabase(factory: IDBFactory): Promise<boolean> {
  return new Promise((resolve) => {
    let request: IDBOpenDBRequest
    try {
      request = factory.deleteDatabase(LAB_DB_NAME)
    } catch {
      resolve(false)
      return
    }
    const timer = setTimeout(() => resolve(false), DELETE_TIMEOUT_MS)
    request.onsuccess = () => {
      clearTimeout(timer)
      resolve(true)
    }
    request.onerror = () => {
      clearTimeout(timer)
      resolve(false)
    }
  })
}

export function isLabCache(name: string): boolean {
  return LAB_CACHE_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}-`) || name.startsWith(`${prefix}:`))
}

async function deleteCaches(storage: Pick<CacheStorage, 'keys' | 'delete'>): Promise<{ names: string[]; complete: boolean }> {
  try {
    const names = (await storage.keys()).filter(isLabCache)
    const results = await Promise.all(names.map((name) => storage.delete(name).catch(() => false)))
    return { names: names.filter((_, index) => results[index]), complete: results.every(Boolean) }
  } catch {
    return { names: [], complete: false }
  }
}

export async function clearAll(): Promise<ClearResult> {
  const { indexedDB, caches } = env()
  const current = connection
  connection = null
  memory = new Map()
  const db = current ? await current : null
  db?.close()
  clearConsent()
  const database = indexedDB ? await deleteDatabase(indexedDB) : true
  const removed = caches ? await deleteCaches(caches) : { names: [], complete: true }
  const result: ClearResult = { database, caches: removed.names, complete: database && removed.complete }
  for (const listener of listeners) listener(result)
  return result
}

export function onLabCleared(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
