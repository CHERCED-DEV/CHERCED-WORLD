import { beforeEach, describe, expect, it } from 'vitest'
import * as route from '@/app/api/inbox-count/route'
import { badgeText, MAILBOX_INTERVAL_MS, mailboxLabel, parseUnread, startVisiblePolling } from '@/components/shell/mailbox'
import { getRepos, registerRepoFactory } from '@/lib/data'
import { createMemoryRepos } from '@/lib/data/memory'
import type { Repos } from '@/lib/data/types'

let repos: Repos

beforeEach(() => {
  registerRepoFactory(() => createMemoryRepos())
  repos = getRepos()
})

const message = (name: string) => ({ name, email: `${name}@example.com`, phone: '+57 300 123 4567', message: `Hola soy ${name}`, consentAt: new Date() })

describe('GET /api/inbox-count', () => {
  it('se revalida cada 30 s', () => {
    expect(route.revalidate).toBe(30)
  })

  it('devuelve solo el número de no leídos, sin datos de visitantes', async () => {
    const ana = await repos.messages.create(message('ana'))
    await repos.messages.create(message('luis'))
    await repos.messages.create(message('eva'))
    await repos.messages.setStatus(ana.id, 'read')

    const response = await route.GET()
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(JSON.parse(text)).toEqual({ unread: 2 })
    expect(Object.keys(JSON.parse(text) as object)).toEqual(['unread'])
    for (const secret of ['ana', 'luis', 'eva', 'example.com', '300', 'Hola']) expect(text).not.toContain(secret)
    expect(response.headers.get('x-robots-tag')).toBe('noindex')
  })

  it('si la base falla responde 0 sin filtrar el error', async () => {
    registerRepoFactory(() => ({ ...createMemoryRepos(), messages: { ...createMemoryRepos().messages, countUnread: () => Promise.reject(new Error('mongo://user:secret@host')) } }))
    const original = console.error
    const logged: string[] = []
    console.error = (line: string) => void logged.push(line)
    try {
      const response = await route.GET()
      expect(await response.json()).toEqual({ unread: 0 })
    } finally {
      console.error = original
    }
    expect(logged.join('\n')).not.toContain('secret')
  })
})

describe('buzón del header', () => {
  it('acepta solo enteros no negativos', () => {
    expect(parseUnread({ unread: 3 })).toBe(3)
    expect(parseUnread({ unread: 0 })).toBe(0)
    for (const bad of [null, 'x', {}, { unread: -1 }, { unread: 1.5 }, { unread: '2' }]) expect(parseUnread(bad)).toBeNull()
  })

  it('arma el nombre accesible y limita el número visible', () => {
    const labels = { name: 'Buzón', one: '1 mensaje sin leer', many: '{count} mensajes sin leer' }
    expect(mailboxLabel(null, labels)).toBe('Buzón')
    expect(mailboxLabel(0, labels)).toBe('Buzón')
    expect(mailboxLabel(1, labels)).toBe('Buzón, 1 mensaje sin leer')
    expect(mailboxLabel(7, labels)).toBe('Buzón, 7 mensajes sin leer')
    expect(badgeText(7)).toBe('7')
    expect(badgeText(120)).toBe('99+')
  })
})

function pollHarness(initial: DocumentVisibilityState = 'visible') {
  let timers: Array<{ id: number; run: () => void; ms: number }> = []
  let nextId = 1
  let onVisibility: (() => void) | null = null
  const doc = {
    visibilityState: initial,
    addEventListener: (_: 'visibilitychange', cb: () => void) => void (onVisibility = cb),
    removeEventListener: () => void (onVisibility = null),
  }
  let runs = 0
  const stop = startVisiblePolling({
    run: () => void (runs += 1),
    interval: MAILBOX_INTERVAL_MS,
    doc,
    setTimer: (run, ms) => {
      const id = nextId++
      timers.push({ id, run, ms })
      return id
    },
    clearTimer: (id) => void (timers = timers.filter((timer) => timer.id !== id)),
  })
  return {
    stop,
    runs: () => runs,
    timers: () => timers,
    tick: () => {
      const pending = timers
      timers = []
      for (const timer of pending) timer.run()
    },
    setVisibility: (state: DocumentVisibilityState) => {
      doc.visibilityState = state
      onVisibility?.()
    },
    listening: () => onVisibility !== null,
  }
}

describe('polling del buzón', () => {
  it('consulta al montar y cada 60 s', () => {
    const poll = pollHarness()
    expect(poll.runs()).toBe(1)
    expect(poll.timers().map((timer) => timer.ms)).toEqual([60_000])
    poll.tick()
    expect(poll.runs()).toBe(2)
    poll.stop()
    expect(poll.timers()).toEqual([])
    expect(poll.listening()).toBe(false)
  })

  it('no consulta con la pestaña oculta y retoma al volver', () => {
    const poll = pollHarness()
    poll.setVisibility('hidden')
    poll.tick()
    expect(poll.runs()).toBe(1)
    expect(poll.timers()).toEqual([])
    poll.setVisibility('visible')
    expect(poll.runs()).toBe(2)
    expect(poll.timers()).toHaveLength(1)
    poll.setVisibility('hidden')
    poll.setVisibility('visible')
    expect(poll.runs()).toBe(2)
    poll.stop()
  })

  it('si carga en una pestaña oculta espera a que se vea', () => {
    const poll = pollHarness('hidden')
    expect(poll.runs()).toBe(0)
    expect(poll.timers()).toEqual([])
    poll.setVisibility('visible')
    expect(poll.runs()).toBe(1)
    poll.stop()
  })
})
