import type { PaidProviderId } from '@/lib/ai/providers/types'
import { testPort } from '../providers/support'
import { arenaAdapter, type ArenaAdapterOptions, type ArenaCall } from './fake-adapter'

export { arenaAdapter, type ArenaAdapterOptions, type ArenaCall } from './fake-adapter'

export function arenaPort(providers: readonly PaidProviderId[], calls: ArenaCall[] = [], options: ArenaAdapterOptions = {}) {
  const adapters = Object.fromEntries(providers.map((provider) => [provider, arenaAdapter(provider, calls, options)]))
  return testPort({ adapters })
}
