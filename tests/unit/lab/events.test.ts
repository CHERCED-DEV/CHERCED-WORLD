import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadDetail, eventRecords, LAB_EVENT_DAYS, labEventsInput, type LabEventInput } from '@/lib/ai/lab/events'
import { createMemoryLabRepo } from '@/lib/data/memory/lab'

const NOW = new Date('2026-11-26T15:00:00Z')

const event = (extra: Record<string, unknown> = {}) => ({ experiment: 'V1', type: 'open', lang: 'es', ...extra }) as LabEventInput

function fakeElement(attributes: Record<string, string>, tag = 'button') {
  const element = {
    getAttributeNames: () => Object.keys(attributes),
    matches: (selector: string) => selector === 'a[download]' && tag === 'a' && 'download' in attributes,
    closest: () => element,
  }
  return element as unknown as Element
}

describe('eventos del AI Lab (038, lab_events)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('FR-3802: el lote solo acepta experimentos, tipos y detalles tipo código, nunca texto libre', () => {
    expect(labEventsInput.safeParse({ events: [event(), event({ type: 'download', detail: 'shot-json' })] }).success).toBe(true)
    expect(labEventsInput.safeParse({ events: [event({ detail: 'lo que escribió la persona' })] }).success).toBe(false)
    expect(labEventsInput.safeParse({ events: [event({ experiment: 'Z9' })] }).success).toBe(false)
    expect(labEventsInput.safeParse({ events: [event({ type: 'typed' })] }).success).toBe(false)
    expect(labEventsInput.safeParse({ events: Array.from({ length: 21 }, () => event()) }).success).toBe(false)
    expect(labEventsInput.safeParse({ events: [] }).success).toBe(false)
  })

  it('FR-3803: cada evento se borra solo a los 90 días y la hora del navegador no puede inventarse', () => {
    const [recent, forged] = eventRecords(
      [
        { experiment: 'V1', type: 'open', lang: 'es', at: NOW.getTime() - 5_000 },
        { experiment: 'V2', type: 'start', lang: 'en', at: NOW.getTime() - 3 * 24 * 60 * 60 * 1000 },
      ],
      'cuenta-1',
      NOW,
    )
    expect(recent!.at.getTime()).toBe(NOW.getTime() - 5_000)
    expect(recent!.expiresAt.getTime() - recent!.at.getTime()).toBe(LAB_EVENT_DAYS * 24 * 60 * 60 * 1000)
    expect(forged!.at).toEqual(NOW)
    expect(forged!.detail).toBeNull()
  })

  it('el repo cuenta por experimento y tipo, y borra los eventos al retirar el consentimiento o borrar la cuenta', async () => {
    const repo = createMemoryLabRepo()
    const records = eventRecords([event(), event({ type: 'start' }), event({ experiment: 'A8', type: 'download', detail: 'file' })], 'cuenta-1', new Date())
    await repo.addEvents(records)
    await repo.addEvents(eventRecords([event()], 'cuenta-2', new Date()))
    expect((await repo.listEventsFor('cuenta-1', 10)).length).toBe(3)
    const counts = await repo.countEvents(new Date(Date.now() - 60_000))
    expect(counts.find((row) => row.experiment === 'V1' && row.type === 'open')?.count).toBe(2)
    await repo.revokeConsent('cuenta-1', new Date())
    expect(await repo.listEventsFor('cuenta-1', 10)).toEqual([])
    await repo.removeAllFor('cuenta-2')
    expect(await repo.countEvents(new Date(0))).toEqual([])
  })

  it('reconoce las descargas por su control, sin leer su contenido', () => {
    expect(downloadDetail(fakeElement({ 'data-cw-shot-json': '' }))).toBe('shot-json')
    expect(downloadDetail(fakeElement({ 'data-cw-subtitles-srt': '' }))).toBe('subtitles-srt')
    expect(downloadDetail(fakeElement({ download: 'x.png' }, 'a'))).toBe('file')
    expect(downloadDetail(fakeElement({ 'data-cw-shot-analyze': '' }))).toBeNull()
    expect(downloadDetail(null)).toBeNull()
  })

  it('FR-3801: sin sesión de cuenta el navegador no manda nada; con sesión, lo manda en lotes', async () => {
    const sent: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(String(init.body))
      return new Response('{}')
    }))
    vi.stubGlobal('window', { addEventListener: () => undefined })
    vi.stubGlobal('document', { cookie: 'otra=1' })
    const anonymous = await import('@/lib/ai/lab/event-client')
    anonymous.labEvent('V1', 'open', 'es')
    expect(anonymous.pendingLabEvents()).toHaveLength(0)
    vi.resetModules()
    vi.stubGlobal('document', { cookie: 'cw-reader=1' })
    const client = await import('@/lib/ai/lab/event-client')
    client.labEvent('V1', 'open', 'es')
    client.labEvent('V1', 'download', 'es', 'texto con espacios')
    expect(client.pendingLabEvents()).toHaveLength(2)
    expect(client.pendingLabEvents()[1]!.detail).toBeUndefined()
    client.flushLabEvents()
    expect(sent).toHaveLength(1)
    expect(JSON.parse(sent[0]!).events).toHaveLength(2)
  })

  it('si el servidor responde que no hay consentimiento, deja de mandar en esa página', async () => {
    const fetcher = vi.fn(async () => new Response('{"error":"no_consent"}', { status: 403 }))
    vi.stubGlobal('fetch', fetcher)
    vi.stubGlobal('window', { addEventListener: () => undefined })
    vi.stubGlobal('document', { cookie: 'cw-reader=1' })
    const client = await import('@/lib/ai/lab/event-client')
    client.labEvent('V1', 'open', 'es')
    client.flushLabEvents()
    await new Promise((resolve) => setTimeout(resolve, 0))
    client.labEvent('V1', 'finish', 'es')
    expect(client.pendingLabEvents()).toHaveLength(0)
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
