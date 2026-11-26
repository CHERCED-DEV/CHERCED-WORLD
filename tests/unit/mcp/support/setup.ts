import { vi } from 'vitest'

export async function portfolioSetup() {
  const { registerRepoFactory } = await import('@/lib/data')
  const { createMemoryRepos } = await import('@/lib/data/memory')
  vi.stubEnv('VERCEL', '')
  vi.stubEnv('VERCEL_ENV', '')
  vi.stubEnv('MONGODB_INTEGRAL_DB', '')
  vi.stubEnv('GEMINI_API_KEY', '')
  registerRepoFactory(() => createMemoryRepos())
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    throw new Error('red real no permitida en pruebas')
  })
}