import 'server-only'
import { createMemoryRepos } from './memory'
import type { RepoFactory, Repos } from './types'

type RepoState = { factory: RepoFactory | null; instance: Repos | null }

const STATE_KEY = Symbol.for('cherced-world.repos')

function state(): RepoState {
  const holder = globalThis as typeof globalThis & { [STATE_KEY]?: RepoState }
  holder[STATE_KEY] ??= { factory: null, instance: null }
  return holder[STATE_KEY]
}

export function registerRepoFactory(factory: RepoFactory): void {
  const current = state()
  current.factory = factory
  current.instance = null
}

export function getRepos(): Repos {
  const current = state()
  current.instance ??= (current.factory ?? createMemoryRepos)()
  return current.instance
}

export type * from './types'
