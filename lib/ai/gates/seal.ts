import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { canonicalJson } from 'cotejo-core'
import { hmacHex } from '@/lib/security/keys'
import type { GateRun } from './schema'

export const SEAL_TTL_MS = 24 * 60 * 60 * 1000

function payload(run: GateRun, accountId: string): string {
  return `gates:v1:${accountId}:${canonicalJson({ ...run, seal: null })}`
}

export function sealRun(run: GateRun, accountId: string): GateRun {
  return { ...run, seal: hmacHex(payload(run, accountId)) }
}

export function sealValid(run: GateRun, accountId: string): boolean {
  if (!run.seal) return false
  const expected = Buffer.from(hmacHex(payload(run, accountId)), 'utf8')
  const given = Buffer.from(run.seal, 'utf8')
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function sealFresh(run: Pick<GateRun, 'at'>, now: Date): boolean {
  const at = Date.parse(run.at)
  return Number.isFinite(at) && now.getTime() - at <= SEAL_TTL_MS && at <= now.getTime() + 60_000
}
