import 'server-only'
import { publicEmail } from '@/content/site'
import { getAccountState } from '@/lib/auth/accounts'
import { getAdminSession } from '@/lib/auth/guard'
import { resolveViewer, type AgentViewer } from './viewer'

export function currentViewer(): Promise<AgentViewer> {
  return resolveViewer({
    isAdmin: async () => Boolean(await getAdminSession()),
    account: async () => {
      const state = await getAccountState()
      return state ? { name: state.account.name, email: state.account.email } : null
    },
    authorEmail: publicEmail(),
  })
}
