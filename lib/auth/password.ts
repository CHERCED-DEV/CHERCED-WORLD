import 'server-only'
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'
import type { AdminCredential, ScryptParams } from '@/lib/data/types'

export const SCRYPT_PARAMS: ScryptParams = { N: 2 ** 17, r: 8, p: 1, keyLen: 64 }

export const SALT_BYTES = 16

const MAX_N = 2 ** 20

function deriveKey(password: string, salt: Buffer, params: ScryptParams): Promise<Buffer> {
  const options: ScryptOptions = {
    N: params.N,
    r: params.r,
    p: params.p,
    maxmem: 256 * params.N * params.r * params.p + 1024 * 1024,
  }
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFC'), salt, params.keyLen, options, (error, key) => {
      if (error) reject(error)
      else resolve(key)
    })
  })
}

function validParams(params: ScryptParams): boolean {
  const { N, r, p, keyLen } = params
  return (
    Number.isInteger(N) && N > 1 && N <= MAX_N && (N & (N - 1)) === 0 &&
    Number.isInteger(r) && r > 0 && r <= 32 &&
    Number.isInteger(p) && p > 0 && p <= 16 &&
    Number.isInteger(keyLen) && keyLen >= 32 && keyLen <= 128
  )
}

export async function hashPassword(password: string, now: Date = new Date()): Promise<AdminCredential> {
  const salt = randomBytes(SALT_BYTES)
  const key = await deriveKey(password, salt, SCRYPT_PARAMS)
  return {
    hash: key.toString('base64'),
    salt: salt.toString('base64'),
    params: { ...SCRYPT_PARAMS },
    createdAt: now,
    updatedAt: now,
  }
}

export async function verifyPassword(password: string, credential: AdminCredential): Promise<boolean> {
  if (!validParams(credential.params)) return false
  const expected = Buffer.from(credential.hash, 'base64')
  const salt = Buffer.from(credential.salt, 'base64')
  if (expected.length !== credential.params.keyLen || salt.length === 0) return false
  const actual = await deriveKey(password, salt, credential.params)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

let dummy: Promise<AdminCredential> | null = null

export async function burnPasswordCheck(password: string): Promise<void> {
  dummy ??= hashPassword(randomBytes(24).toString('base64'))
  await verifyPassword(password, await dummy)
}
