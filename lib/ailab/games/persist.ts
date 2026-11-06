import { NET_SIZES, adamFromArrays, adamToArrays, netFromArrays, netToArrays, type Adam, type Net } from './net'

export const GAME_STATE_VERSION = 1

export type GameMode = 'rival' | 'clone'

export const GAME_KEYS: Record<GameMode, string> = { rival: 'J1:rival', clone: 'J2:clone' }

export const MAX_CURVE = 240

export type StoredGame = {
  version: number
  mode: GameMode
  weights: Float32Array[]
  optimizer: Float32Array[] | null
  curve: number[]
  rallies: number
  similarity: number | null
  updatedAt: number
}

export type GameSnapshot = {
  net: Net
  adam: Adam | null
  curve: number[]
  rallies: number
  similarity: number | null
  updatedAt: number
}

export function toStored(mode: GameMode, snapshot: Omit<GameSnapshot, 'updatedAt'> & { updatedAt?: number }): StoredGame {
  return {
    version: GAME_STATE_VERSION,
    mode,
    weights: netToArrays(snapshot.net),
    optimizer: snapshot.adam ? adamToArrays(snapshot.adam) : null,
    curve: snapshot.curve.slice(-MAX_CURVE).map((value) => Math.round(value * 1000) / 1000),
    rallies: Math.max(0, Math.round(snapshot.rallies)),
    similarity: snapshot.similarity,
    updatedAt: snapshot.updatedAt ?? Date.now(),
  }
}

function isRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

export function fromStored(value: unknown, mode: GameMode): GameSnapshot | null {
  if (!value || typeof value !== 'object') return null
  const stored = value as Partial<StoredGame>
  if (stored.version !== GAME_STATE_VERSION || stored.mode !== mode) return null
  const net = netFromArrays(stored.weights, NET_SIZES)
  if (!net) return null
  const adam = stored.optimizer ? adamFromArrays(stored.optimizer, net) : null
  const curve = Array.isArray(stored.curve) ? stored.curve.filter(isRate).slice(-MAX_CURVE) : []
  const rallies = typeof stored.rallies === 'number' && Number.isFinite(stored.rallies) && stored.rallies >= 0 ? Math.round(stored.rallies) : curve.length
  const similarity = isRate(stored.similarity) ? stored.similarity : null
  if (mode === 'clone' && similarity === null) return null
  const updatedAt = typeof stored.updatedAt === 'number' && Number.isFinite(stored.updatedAt) ? stored.updatedAt : 0
  return { net, adam, curve, rallies, similarity, updatedAt }
}
