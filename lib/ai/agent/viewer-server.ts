import 'server-only'
import { cookies } from 'next/headers'
import { publicEmail } from '@/content/site'
import { getAccountState } from '@/lib/auth/accounts'
import { getAdminSession } from '@/lib/auth/guard'
import { GUEST_MODE_ENV, GUEST_OFF_COOKIE, isGuestEmail, parseGuestMode, type GuestMode } from './guest'
import { resolveViewer, type AgentViewer } from './viewer'

export function currentGuestMode(): GuestMode | null {
  return parseGuestMode(process.env[GUEST_MODE_ENV])
}

export async function guestModeOff(): Promise<boolean> {
  try {
    return (await cookies()).get(GUEST_OFF_COOKIE)?.value === '1'
  } catch {
    return false
  }
}

export async function guestSession(): Promise<{ mode: GuestMode; email: string; off: boolean } | null> {
  const mode = currentGuestMode()
  if (!mode) return null
  if (await getAdminSession()) return null
  const state = await getAccountState()
  if (!state || !isGuestEmail(mode, state.account.email)) return null
  return { mode, email: state.account.email, off: await guestModeOff() }
}

export async function currentViewer(): Promise<AgentViewer> {
  const mode = currentGuestMode()
  const off = mode ? await guestModeOff() : false
  return resolveViewer({
    isAdmin: async () => Boolean(await getAdminSession()),
    account: async () => {
      const state = await getAccountState()
      return state ? { name: state.account.name, email: state.account.email } : null
    },
    authorEmail: publicEmail(),
    guest: (email) => (mode && !off && isGuestEmail(mode, email) ? { name: mode.name } : null),
  })
}
