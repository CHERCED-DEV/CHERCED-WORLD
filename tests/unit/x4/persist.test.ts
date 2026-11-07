import { afterEach, describe, expect, it } from 'vitest'
import { LAB_DB_NAME, LAB_DB_STORE, clearAll, labStore, setLabStorageEnv } from '@/lib/ailab/core/store'
import { createAdam, createNet, forward, seededRandom } from '@/lib/ailab/games/net'
import { GAME_KEYS, GAME_STATE_VERSION, MAX_CURVE, fromStored, toStored } from '@/lib/ailab/games/persist'
import { fakeIndexedDB } from '../x0/support'

afterEach(() => setLabStorageEnv(undefined))

describe('lo que aprende queda en el navegador, con versión (T755, FR-313)', () => {
  it('el rival se guarda con la forma del plan y vuelve igual', () => {
    const net = createNet(undefined, seededRandom(3))
    const adam = createAdam(net)
    adam.t = 4
    const stored = toStored('rival', { net, adam, curve: [0.1, 0.5, 0.123456], rallies: 3, similarity: null, updatedAt: 99 })
    expect(stored).toMatchObject({ version: GAME_STATE_VERSION, mode: 'rival', curve: [0.1, 0.5, 0.123], rallies: 3, updatedAt: 99 })
    expect(stored.weights.every((layer) => layer instanceof Float32Array)).toBe(true)
    const back = fromStored(structuredClone(stored), 'rival')!
    expect(back.rallies).toBe(3)
    expect(back.adam?.t).toBe(4)
    const input = [0.1, -0.2, 1, 0.5, 0, 0.3]
    expect(forward(back.net, input).probs).toEqual(forward(net, input).probs)
  })

  it('descarta otra versión, otro modo o datos rotos: el rival empieza de nuevo', () => {
    const net = createNet(undefined, seededRandom(3))
    const stored = toStored('rival', { net, adam: null, curve: [], rallies: 0, similarity: null })
    expect(fromStored({ ...stored, version: GAME_STATE_VERSION + 1 }, 'rival')).toBeNull()
    expect(fromStored(stored, 'clone')).toBeNull()
    expect(fromStored({ ...stored, weights: stored.weights.slice(2) }, 'rival')).toBeNull()
    expect(fromStored('basura', 'rival')).toBeNull()
    expect(fromStored(null, 'rival')).toBeNull()
    const odd = fromStored({ ...stored, curve: [0.5, 7, Number.NaN, -1, 0.2], rallies: -3, optimizer: [new Float32Array(2)] }, 'rival')!
    expect(odd.curve).toEqual([0.5, 0.2])
    expect(odd.rallies).toBe(2)
    expect(odd.adam).toBeNull()
  })

  it('el clon guarda su parecido y sin él no vale', () => {
    const net = createNet(undefined, seededRandom(3))
    const stored = toStored('clone', { net, adam: null, curve: [0.4, 0.9], rallies: 3, similarity: 0.87 })
    expect(fromStored(stored, 'clone')?.similarity).toBe(0.87)
    expect(fromStored({ ...stored, similarity: null }, 'clone')).toBeNull()
  })

  it('la curva guardada tiene tope', () => {
    const net = createNet(undefined, seededRandom(3))
    const curve = Array.from({ length: MAX_CURVE + 30 }, (_, index) => (index % 10) / 10)
    expect(toStored('rival', { net, adam: null, curve, rallies: curve.length, similarity: null }).curve).toHaveLength(MAX_CURVE)
  })

  it('con labStore: se guarda en cw-ailab/games, una versión vieja se borra y "Borrar" lo quita todo', async () => {
    const idb = fakeIndexedDB()
    setLabStorageEnv({ indexedDB: idb.factory, caches: null })
    const net = createNet(undefined, seededRandom(1))
    expect(await labStore.set(GAME_KEYS.rival, toStored('rival', { net, adam: null, curve: [0.3], rallies: 1, similarity: null }))).toBe(true)
    expect(idb.databases.get(LAB_DB_NAME)?.get(LAB_DB_STORE)?.has('J1:rival')).toBe(true)
    expect(fromStored(await labStore.get(GAME_KEYS.rival, { version: GAME_STATE_VERSION }), 'rival')?.curve).toEqual([0.3])

    await labStore.set(GAME_KEYS.clone, { ...toStored('clone', { net, adam: null, curve: [], rallies: 0, similarity: 0.5 }), version: 0 })
    expect(await labStore.get(GAME_KEYS.clone, { version: GAME_STATE_VERSION })).toBeNull()
    expect(idb.databases.get(LAB_DB_NAME)?.get(LAB_DB_STORE)?.has('J2:clone')).toBe(false)

    await clearAll()
    expect(await labStore.get(GAME_KEYS.rival, { version: GAME_STATE_VERSION })).toBeNull()
  })

  it('sin almacenamiento (modo privado) sigue en memoria y lo dice con false', async () => {
    setLabStorageEnv({ indexedDB: null, caches: null })
    const net = createNet(undefined, seededRandom(1))
    expect(await labStore.set(GAME_KEYS.rival, toStored('rival', { net, adam: null, curve: [], rallies: 0, similarity: null }))).toBe(false)
    expect(fromStored(await labStore.get(GAME_KEYS.rival, { version: GAME_STATE_VERSION }), 'rival')).not.toBeNull()
  })
})
