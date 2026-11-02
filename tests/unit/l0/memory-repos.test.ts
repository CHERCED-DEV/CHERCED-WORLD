import { describe, expect, it } from 'vitest'
import { getRepos, registerRepoFactory } from '@/lib/data'
import { createMemoryRepos } from '@/lib/data/memory'
import { runRepoContract } from '../../contract/repos.contract'

runRepoContract('memoria', { setup: () => createMemoryRepos() })

describe('getRepos', () => {
  it('usa los fakes en memoria por defecto y devuelve siempre la misma instancia', () => {
    const first = getRepos()
    expect(first).toBe(getRepos())
    expect(typeof first.messages.create).toBe('function')
  })

  it('usa la fábrica registrada por otra lane', () => {
    const custom = createMemoryRepos()
    registerRepoFactory(() => custom)
    expect(getRepos()).toBe(custom)
    registerRepoFactory(() => createMemoryRepos())
    expect(getRepos()).not.toBe(custom)
  })
})
