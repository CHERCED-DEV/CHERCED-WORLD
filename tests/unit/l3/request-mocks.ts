import { vi } from 'vitest'

type CookieOptions = Record<string, unknown>

export type StoredCookie = { name: string; value: string; options: CookieOptions }

export const request = {
  headers: new Headers(),
  cookies: new Map<string, StoredCookie>(),
  deleted: [] as StoredCookie[],
  redirects: [] as string[],
  refreshes: 0,
  revalidated: [] as string[],
}

export function resetRequest(ip = '203.0.113.10'): void {
  request.headers = new Headers({ 'x-forwarded-for': ip })
  request.cookies.clear()
  request.deleted = []
  request.redirects = []
  request.refreshes = 0
  request.revalidated = []
}

export class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`NEXT_REDIRECT ${url}`)
  }
}

const cookieStore = {
  get(name: string) {
    const cookie = request.cookies.get(name)
    return cookie ? { name, value: cookie.value } : undefined
  },
  set(name: string, value: string, options: CookieOptions = {}) {
    request.cookies.set(name, { name, value, options })
  },
  delete(arg: string | ({ name: string } & CookieOptions)) {
    const { name, ...options } = typeof arg === 'string' ? { name: arg } : arg
    request.deleted.push({ name, value: '', options })
    request.cookies.delete(name)
  },
}

vi.mock('next/headers', () => ({
  headers: async () => request.headers,
  cookies: async () => cookieStore,
}))

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    request.redirects.push(url)
    throw new RedirectSignal(url)
  },
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

vi.mock('next/cache', () => ({
  refresh: () => {
    request.refreshes += 1
  },
  revalidatePath: (path: string) => {
    request.revalidated.push(path)
  },
}))

export function form(values: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

export async function expectRedirect(promise: Promise<unknown>, url: string): Promise<void> {
  try {
    await promise
  } catch (error) {
    if (error instanceof RedirectSignal && error.url === url) return
    throw error
  }
  throw new Error(`se esperaba redirect a ${url}`)
}
