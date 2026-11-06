import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_STORAGE_KEY, grantConsent, hasConsent, setConsentStorage, type ConsentStorage } from '@/lib/ailab/core/consent'
import { LAB_DB_NAME, LAB_DB_STORE, clearAll, isLabCache, labStore, onLabCleared, setLabStorageEnv } from '@/lib/ailab/core/store'
import { fakeCaches, fakeIndexedDB } from './support'

function session(): ConsentStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => void data.set(key, value), removeItem: (key) => void data.delete(key) }
}

afterEach(() => {
  setLabStorageEnv(undefined)
  setConsentStorage(undefined)
})

describe('labStore sobre IndexedDB cw-ailab (FR-313)', () => {
  it('guarda y lee en la base cw-ailab, store games', async () => {
    const idb = fakeIndexedDB()
    setLabStorageEnv({ indexedDB: idb.factory, caches: null })
    const state = { version: 1, mode: 'rival', weights: [new Float32Array([0.5, -0.25])], curve: [0.1, 0.4], updatedAt: '2026-11-05' }
    await expect(labStore.set('J1:rival', state)).resolves.toBe(true)
    await expect(labStore.persistent()).resolves.toBe(true)
    expect(idb.databases.get(LAB_DB_NAME)?.get(LAB_DB_STORE)?.has('J1:rival')).toBe(true)
    const read = await labStore.get<typeof state>('J1:rival', { version: 1 })
    expect(read?.curve).toEqual([0.1, 0.4])
    expect(Array.from(read?.weights[0] ?? [])).toEqual([0.5, -0.25])
  })

  it('descarta y borra un estado de otra versión', async () => {
    const idb = fakeIndexedDB()
    setLabStorageEnv({ indexedDB: idb.factory, caches: null })
    await labStore.set('J2:clone', { version: 0, curve: [] })
    await expect(labStore.get('J2:clone', { version: 1 })).resolves.toBeNull()
    expect(idb.databases.get(LAB_DB_NAME)?.get(LAB_DB_STORE)?.has('J2:clone')).toBe(false)
    await labStore.set('raw', 'sin versión')
    await expect(labStore.get('raw', { version: 1 })).resolves.toBeNull()
  })

  it('borra una clave y vacía el store', async () => {
    setLabStorageEnv({ indexedDB: fakeIndexedDB().factory, caches: null })
    await labStore.set('a', { version: 1 })
    await labStore.set('b', { version: 1 })
    await labStore.delete('a')
    await expect(labStore.get('a')).resolves.toBeNull()
    await labStore.clear()
    await expect(labStore.get('b')).resolves.toBeNull()
  })

  it('sin IndexedDB (modo privado) funciona en memoria y lo dice', async () => {
    setLabStorageEnv({ indexedDB: null, caches: null })
    await expect(labStore.set('J1:rival', { version: 1, curve: [1] })).resolves.toBe(false)
    await expect(labStore.get('J1:rival', { version: 1 })).resolves.toEqual({ version: 1, curve: [1] })
    await expect(labStore.persistent()).resolves.toBe(false)
  })

  it('si IndexedDB no abre, también cae a memoria', async () => {
    const idb = fakeIndexedDB()
    idb.failOpen(true)
    setLabStorageEnv({ indexedDB: idb.factory, caches: null })
    await expect(labStore.set('J1:rival', { version: 1 })).resolves.toBe(false)
    await expect(labStore.get('J1:rival')).resolves.toEqual({ version: 1 })
  })
})

describe('clearAll: "Borrar lo que el laboratorio guardó" (FR-312)', () => {
  it('borra la base, las cachés de modelos del laboratorio y el consentimiento, y avisa', async () => {
    const idb = fakeIndexedDB()
    const caches = fakeCaches(['transformers-cache', 'cw-ailab-pyodide', 'cw-ailab', 'otra-cache', 'transformers-cache-de-otro'])
    const storage = session()
    setLabStorageEnv({ indexedDB: idb.factory, caches })
    setConsentStorage(storage)
    await labStore.set('J1:rival', { version: 1 })
    grantConsent('V1', 'Whisper base (int8)')
    const listener = vi.fn()
    const off = onLabCleared(listener)
    const result = await clearAll()
    off()
    expect(result).toEqual({ database: true, caches: ['transformers-cache', 'cw-ailab-pyodide', 'cw-ailab', 'transformers-cache-de-otro'], complete: true })
    expect(idb.databases.has(LAB_DB_NAME)).toBe(false)
    expect(idb.closed()).toBe(1)
    expect([...caches.live]).toEqual(['otra-cache'])
    expect(storage.data.has(CONSENT_STORAGE_KEY)).toBe(false)
    expect(hasConsent('V1', 'Whisper base (int8)')).toBe(false)
    expect(listener).toHaveBeenCalledWith(result)
    await expect(labStore.get('J1:rival')).resolves.toBeNull()
  })

  it('si el navegador no deja borrar una caché, lo reporta incompleto', async () => {
    setLabStorageEnv({ indexedDB: fakeIndexedDB().factory, caches: fakeCaches(['transformers-cache'], ['transformers-cache']) })
    setConsentStorage(session())
    await expect(clearAll()).resolves.toEqual({ database: true, caches: [], complete: false })
  })

  it('sin almacenamiento no falla y también borra lo que había en memoria', async () => {
    setLabStorageEnv({ indexedDB: null, caches: null })
    setConsentStorage(null)
    await labStore.set('J1:rival', { version: 1 })
    await expect(clearAll()).resolves.toEqual({ database: true, caches: [], complete: true })
    await expect(labStore.get('J1:rival')).resolves.toBeNull()
  })

  it('reconoce solo las cachés del laboratorio', () => {
    expect(isLabCache('transformers-cache')).toBe(true)
    expect(isLabCache('cw-ailab')).toBe(true)
    expect(isLabCache('cw-ailab-pyodide')).toBe(true)
    expect(isLabCache('cw-ailab:onnx')).toBe(true)
    expect(isLabCache('next-data')).toBe(false)
    expect(isLabCache('cw-ailabx')).toBe(false)
  })
})
