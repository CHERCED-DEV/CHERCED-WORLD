import 'server-only'
import { registerRepoFactory } from '@/lib/data'
import { hasDatabaseEnv } from '@/lib/security/keys'
import { getDb } from './client'
import { createMongoRepos } from './index'

const REGISTERED = Symbol.for('cherced-world.mongo-registered')

export function registerMongoRepos(): boolean {
  const holder = globalThis as typeof globalThis & { [REGISTERED]?: true }
  if (!hasDatabaseEnv()) return false
  if (holder[REGISTERED]) return true
  holder[REGISTERED] = true
  registerRepoFactory(() => createMongoRepos(getDb))
  return true
}

registerMongoRepos()
