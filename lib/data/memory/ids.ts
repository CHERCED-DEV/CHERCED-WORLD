import 'server-only'
import { randomBytes } from 'node:crypto'

export function newId(): string {
  return randomBytes(12).toString('hex')
}

export function clone<T>(value: T): T {
  return structuredClone(value)
}
