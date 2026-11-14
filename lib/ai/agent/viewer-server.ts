import 'server-only'
import { publicEmail } from '@/content/site'
import { getAccountState } from '@/lib/auth/accounts'
import { getAdminSession } from '@/lib/auth/guard'
import { GUEST_MODE_ENV, isGuestEmail, parseGuestMode, type GuestMode } from './guest'
import { resolveViewer, type AgentViewer } from './viewer'

export function currentGuestMode(): GuestMode | null {
  return parseGuestMode(process.env[GUEST_MODE_ENV])
}

export function currentViewer(): Promise<AgentViewer> {
  const mode = currentGuestMode()
  return resolveViewer({
    isAdmin: async () => Boolean(await getAdminSession()),
    account: async () => {
      const state = await getAccountState()
      return state ? { name: state.account.name, email: state.account.email } : null
    },
    authorEmail: publicEmail(),
    guest: (email) => (mode && isGuestEmail(mode, email) ? { name: mode.name } : null),
  })
}
