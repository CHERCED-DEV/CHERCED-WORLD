import 'server-only'
import { randomInt, timingSafeEqual } from 'node:crypto'
import type { AdminRepo } from '@/lib/data/types'
import { sha256Hex } from '@/lib/security/keys'
import { LOG_PREFIX } from '@/lib/security/log'
import { normalizeSetupCode, SETUP_CODE_ALPHABET, SETUP_CODE_LENGTH } from '@/lib/validation'

export const SETUP_CODE_TTL_MS = 24 * 60 * 60 * 1000

export type SetupCodeState = 'created' | 'pending' | 'configured'

export function generateSetupCode(): string {
  let code = ''
  for (let i = 0; i < SETUP_CODE_LENGTH; i++) code += SETUP_CODE_ALPHABET[randomInt(SETUP_CODE_ALPHABET.length)]
  return code
}

export function formatSetupCode(code: string): string {
  const normalized = normalizeSetupCode(code)
  const half = Math.ceil(normalized.length / 2)
  return `${normalized.slice(0, half)}-${normalized.slice(half)}`
}

export function hashSetupCode(code: string): string {
  return sha256Hex(`setup:${normalizeSetupCode(code)}`)
}

export function setupLogLine(code: string, expiresAt: Date): string {
  return `${LOG_PREFIX} Código de configuración inicial: ${formatSetupCode(code)} (vence ${expiresAt.toISOString()})`
}

export async function ensureSetupCode(
  admin: AdminRepo,
  now: Date,
  log: (line: string) => void = (line) => console.warn(line),
): Promise<SetupCodeState> {
  if (await admin.getCredential()) return 'configured'
  const current = await admin.getSetupCode()
  if (current && current.expiresAt.getTime() > now.getTime()) return 'pending'
  const code = generateSetupCode()
  const expiresAt = new Date(now.getTime() + SETUP_CODE_TTL_MS)
  await admin.saveSetupCode({ codeHash: hashSetupCode(code), expiresAt, createdAt: now })
  log(setupLogLine(code, expiresAt))
  return 'created'
}

export async function verifySetupCode(admin: AdminRepo, code: string, now: Date): Promise<boolean> {
  const current = await admin.getSetupCode()
  if (!current || current.expiresAt.getTime() <= now.getTime()) return false
  const expected = Buffer.from(current.codeHash, 'hex')
  const actual = Buffer.from(hashSetupCode(code), 'hex')
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
