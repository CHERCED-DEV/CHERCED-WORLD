import 'server-only'
import type { Repos } from '@/lib/data/types'

export class DatabaseUnavailableError extends Error {
  constructor() {
    super('database unavailable')
    this.name = 'DatabaseUnavailable'
  }
}

function unavailableRepo<T extends object>(): T {
  return new Proxy({} as T, {
    get: (_target, property) =>
      property === 'then' ? undefined : () => Promise.reject(new DatabaseUnavailableError()),
  })
}

export function createUnavailableRepos(): Repos {
  return {
    messages: unavailableRepo(),
    comments: unavailableRepo(),
    admin: unavailableRepo(),
    rateLimits: unavailableRepo(),
  }
}
