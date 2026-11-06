type Handler = (() => void) | null

type FakeRequest<T> = {
  result: T
  error: unknown
  onsuccess: Handler
  onerror: Handler
  onupgradeneeded: Handler
  onblocked: Handler
}

function request<T>(work: () => T): FakeRequest<T> {
  const req = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null } as unknown as FakeRequest<T>
  queueMicrotask(() => {
    try {
      req.result = work()
      req.onsuccess?.()
    } catch (error) {
      req.error = error
      req.onerror?.()
    }
  })
  return req
}

export type FakeIndexedDB = {
  factory: IDBFactory
  databases: Map<string, Map<string, Map<IDBValidKey, unknown>>>
  closed: () => number
  failOpen: (fail: boolean) => void
}

export function fakeIndexedDB(): FakeIndexedDB {
  const databases = new Map<string, Map<string, Map<IDBValidKey, unknown>>>()
  let closed = 0
  let failing = false

  const factory = {
    open(name: string) {
      const req = { result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null } as unknown as FakeRequest<unknown>
      queueMicrotask(() => {
        if (failing) {
          req.error = new Error('IndexedDB bloqueado')
          req.onerror?.()
          return
        }
        const fresh = !databases.has(name)
        const stores = databases.get(name) ?? new Map<string, Map<IDBValidKey, unknown>>()
        databases.set(name, stores)
        req.result = {
          objectStoreNames: { contains: (store: string) => stores.has(store) },
          createObjectStore: (store: string) => stores.set(store, new Map()),
          transaction: (store: string) => ({
            objectStore: () => {
              const data = stores.get(store)
              if (!data) throw new Error(`no existe el store ${store}`)
              return {
                get: (key: IDBValidKey) => request(() => data.get(key)),
                put: (value: unknown, key: IDBValidKey) => request(() => (data.set(key, structuredClone(value)), key)),
                delete: (key: IDBValidKey) => request(() => void data.delete(key)),
                clear: () => request(() => data.clear()),
              }
            },
          }),
          close: () => {
            closed += 1
          },
          onversionchange: null,
        }
        if (fresh) req.onupgradeneeded?.()
        req.onsuccess?.()
      })
      return req
    },
    deleteDatabase(name: string) {
      return request(() => void databases.delete(name))
    },
  }

  return {
    factory: factory as unknown as IDBFactory,
    databases,
    closed: () => closed,
    failOpen: (fail) => {
      failing = fail
    },
  }
}

export function fakeCaches(names: string[], failing: string[] = []) {
  const live = new Set(names)
  return {
    live,
    keys: async () => [...live],
    delete: async (name: string) => {
      if (failing.includes(name)) throw new Error(`no se pudo borrar ${name}`)
      return live.delete(name)
    },
  }
}
