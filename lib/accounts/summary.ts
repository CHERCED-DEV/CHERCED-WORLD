export const ACCOUNT_ENDPOINT = '/api/account'

export type AccountSummary = { signedIn: false } | { signedIn: true; name: string }

export function parseAccountSummary(body: unknown): AccountSummary {
  if (body && typeof body === 'object' && (body as { signedIn?: unknown }).signedIn === true) {
    const name = (body as { name?: unknown }).name
    if (typeof name === 'string' && name.trim()) return { signedIn: true, name }
  }
  return { signedIn: false }
}
