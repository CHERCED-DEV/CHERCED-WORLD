import { describe, expect, it } from 'vitest'
import {
  canAutoLoad,
  EMBED_SANDBOX,
  EMBED_TIMEOUT_MS,
  embedAddress,
  embedFrameMounted,
  ENGAGE_KEYS,
  nextEmbedStatus,
  type EmbedEvent,
  type EmbedStatus,
} from '@/components/site/portfolio/embed'
import { getProjects } from '@/lib/content'

function run(events: EmbedEvent[], from: EmbedStatus = 'idle'): EmbedStatus {
  return events.reduce(nextEmbedStatus, from)
}

describe('estados del embebido (FR-206)', () => {
  it('no carga nada hasta que se pide', () => {
    expect(embedFrameMounted('idle')).toBe(false)
    expect(run(['load', 'timeout', 'reload'])).toBe('idle')
  })

  it('pasa de pedido a cargado cuando el iframe avisa', () => {
    expect(run(['request'])).toBe('loading')
    expect(run(['request', 'load'])).toBe('ready')
    expect(embedFrameMounted('loading')).toBe(true)
    expect(embedFrameMounted('ready')).toBe(true)
  })

  it('cae a la captura si se agota el tiempo y desmonta el iframe', () => {
    expect(run(['request', 'timeout'])).toBe('slow')
    expect(embedFrameMounted('slow')).toBe(false)
  })

  it('ignora un tiempo agotado que llega después de cargar', () => {
    expect(run(['request', 'load', 'timeout'])).toBe('ready')
  })

  it('reintenta desde la captura y recarga desde cualquier estado activo', () => {
    expect(run(['request', 'timeout', 'request'])).toBe('loading')
    expect(run(['request', 'load', 'reload'])).toBe('loading')
    expect(run(['request', 'timeout', 'reload'])).toBe('loading')
  })

  it('vuelve al reposo al cerrar', () => {
    expect(run(['request', 'load', 'reset'])).toBe('idle')
  })

  it('usa el sandbox exacto del spec y 10 s de espera', () => {
    expect(EMBED_SANDBOX).toBe('allow-scripts allow-same-origin allow-forms allow-popups')
    expect(EMBED_TIMEOUT_MS).toBe(10_000)
  })
})

describe('barra de URL', () => {
  it('muestra el host y omite la raíz', () => {
    expect(embedAddress('https://quantic-theatrum.vercel.app/')).toEqual({
      origin: 'https://quantic-theatrum.vercel.app',
      host: 'quantic-theatrum.vercel.app',
      path: '',
    })
    expect(embedAddress('https://example.com/app?x=1').path).toBe('/app?x=1')
  })

  it('entiende todos los enlaces en vivo del contenido', () => {
    for (const project of getProjects()) {
      if (!project.links.live) continue
      expect(embedAddress(project.links.live).origin, project.id).toMatch(/^https:\/\//)
    }
  })
})

describe('carga al entrar en pantalla', () => {
  const base = { wide: true, saveData: false, framed: false, engaged: true }

  it('solo en pantallas anchas, con el visitante desplazándose', () => {
    expect(canAutoLoad(base)).toBe(true)
    expect(canAutoLoad({ ...base, wide: false })).toBe(false)
    expect(canAutoLoad({ ...base, engaged: false })).toBe(false)
  })

  it('respeta el ahorro de datos y no se anida dentro de otro iframe', () => {
    expect(canAutoLoad({ ...base, saveData: true })).toBe(false)
    expect(canAutoLoad({ ...base, framed: true })).toBe(false)
  })

  it('cuenta como desplazamiento las teclas de scroll, no Tab ni Enter', () => {
    for (const key of ['ArrowDown', 'PageDown', ' ', 'End']) expect(ENGAGE_KEYS.has(key), key).toBe(true)
    for (const key of ['Tab', 'Enter', 'a']) expect(ENGAGE_KEYS.has(key), key).toBe(false)
  })
})
