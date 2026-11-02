import 'server-only'
import { registerRepoFactory } from '@/lib/data'
import { DATABASE_ENV } from '@/lib/security/keys'
import { getDb } from './client'
import { createMongoRepos } from './index'
import { createUnavailableRepos } from './unavailable'

export type RepoBackend = 'mongo' | 'unavailable' | 'memory'

const REGISTERED = Symbol.for('cherced-world.mongo-registered')

export function repoBackend(env: Record<string, string | undefined> = process.env): RepoBackend {
  if (env[DATABASE_ENV]) return 'mongo'
  return env.VERCEL ? 'unavailable' : 'memory'
}

export function registerMongoRepos(): RepoBackend {
  const backend = repoBackend()
  if (backend === 'memory') return backend
  const holder = globalThis as typeof globalThis & { [REGISTERED]?: RepoBackend }
  if (holder[REGISTERED] === backend) return backend
  holder[REGISTERED] = backend
  registerRepoFactory(backend === 'mongo' ? () => createMongoRepos(getDb) : createUnavailableRepos)
  return backend
}

registerMongoRepos()
