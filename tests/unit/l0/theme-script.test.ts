import { describe, expect, it } from 'vitest'
import { themeScript } from '@/components/shell/themeScript'

type Env = {
  stored?: string | null
  prefersLight?: boolean
  introSeen?: boolean
  storageThrows?: boolean
}

function run(env: Env = {}) {
  const attributes = new Map<string, string>()
  const listeners = new Map<string, (event: { detail?: unknown }) => void>()
  const local = new Map<string, string>()
  if (env.stored) local.set('cw-theme', env.stored)
  const session = new Map<string, string>()
  if (env.introSeen) session.set('cw-intro-seen', '1')

  const storage = (map: Map<string, string>) => ({
    getItem: (key: string) => {
      if (env.storageThrows) throw new Error('blocked')
      return map.get(key) ?? null
    },
    setItem: (key: string, value: string) => {
      if (env.storageThrows) throw new Error('blocked')
      map.set(key, value)
    },
  })

  const documentElement = { setAttribute: (name: string, value: string) => attributes.set(name, value) }
  const window = {
    matchMedia: (query: string) => ({ matches: query.includes('light') && env.prefersLight === true }),
    addEventListener: (name: string, handler: (event: { detail?: unknown }) => void) => listeners.set(name, handler),
  }

  new Function('document', 'window', 'localStorage', 'sessionStorage', themeScript)(
    { documentElement },
    window,
    storage(local),
    storage(session),
  )

  const dispatch = (detail: unknown) => listeners.get('cw:theme-change')?.({ detail })
  return { attributes, local, dispatch }
}

describe('script de tema e intro', () => {
  it('usa oscuro por defecto y marca que hay JS', () => {
    const { attributes } = run()
    expect(attributes.get('data-theme')).toBe('dark')
    expect(attributes.get('data-js')).toBe('')
  })

  it('respeta la preferencia del sistema en la primera visita', () => {
    expect(run({ prefersLight: true }).attributes.get('data-theme')).toBe('light')
  })

  it('la elección guardada gana sobre el sistema', () => {
    expect(run({ stored: 'dark', prefersLight: true }).attributes.get('data-theme')).toBe('dark')
    expect(run({ stored: 'light' }).attributes.get('data-theme')).toBe('light')
    expect(run({ stored: 'rosa' }).attributes.get('data-theme')).toBe('dark')
  })

  it('muestra la intro una vez por sesión', () => {
    expect(run().attributes.get('data-intro')).toBe('pending')
    expect(run({ introSeen: true }).attributes.get('data-intro')).toBe('seen')
  })

  it('no falla si el almacenamiento está bloqueado y omite la intro', () => {
    const { attributes } = run({ storageThrows: true })
    expect(attributes.get('data-theme')).toBe('dark')
    expect(attributes.get('data-intro')).toBe('seen')
  })

  it('aplica y recuerda cw:theme-change, ignorando valores inválidos', () => {
    const { attributes, local, dispatch } = run()
    dispatch('light')
    expect(attributes.get('data-theme')).toBe('light')
    expect(local.get('cw-theme')).toBe('light')
    dispatch('neon')
    expect(attributes.get('data-theme')).toBe('light')
  })
})
