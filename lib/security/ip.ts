import 'server-only'
import { hmacHex } from './keys'

type HeaderSource = { get(name: string): string | null }

export const UNKNOWN_IP = 'unknown'

const MAX_IP_LENGTH = 64

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.length > MAX_IP_LENGTH) return null
  return trimmed
}

export function clientIp(headers: HeaderSource): string {
  const forwarded = headers.get('x-forwarded-for')
  const first = clean(forwarded?.split(',')[0])
  if (first) return first
  return clean(headers.get('x-real-ip')) ?? UNKNOWN_IP
}

export function ipHash(ip: string): string {
  return hmacHex(ip.toLowerCase())
}
