import 'server-only'
import { createHash, createHmac } from 'node:crypto'

export const DATABASE_ENV = 'MONGODB_INTEGRAL_DB'

const LOCAL_FALLBACK_SEED = 'cherced-world:solo-entorno-local-sin-base'

export function hasDatabaseEnv(): boolean {
  return Boolean(process.env[DATABASE_ENV])
}

export function serverKey(): Buffer {
  const seed = process.env[DATABASE_ENV] || LOCAL_FALLBACK_SEED
  return createHash('sha256').update(seed, 'utf8').digest()
}

export function hmacHex(value: string): string {
  return createHmac('sha256', serverKey()).update(value, 'utf8').digest('hex')
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
