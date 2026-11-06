import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_STORAGE_KEY,
  clearConsent,
  consentedKeys,
  consentedResources,
  hasConsent,
  hasConsentPresenter,
  onConsentChange,
  requestDownload,
  setConsentPresenter,
  setConsentStorage,
  withdrawConsent,
  type ConsentStorage,
  type DownloadRequest,
} from '@/lib/ailab/core/consent'

const BASE: DownloadRequest = { experiment: 'V1', resource: 'Whisper base (int8)', bytes: 77_000_000, host: 'huggingface.co' }
const TINY: DownloadRequest = { experiment: 'V1', resource: 'Whisper tiny (int8)', bytes: 41_000_000, host: 'huggingface.co' }

function memoryStorage(): ConsentStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

let storage: ReturnType<typeof memoryStorage>
let release: Array<() => void> = []

function present(answer: boolean | ((request: DownloadRequest) => Promise<boolean>)) {
  const presenter = vi.fn(typeof answer === 'function' ? answer : async () => answer)
  release.push(setConsentPresenter(presenter))
  return presenter
}

beforeEach(() => {
  storage = memoryStorage()
  setConsentStorage(storage)
})

afterEach(() => {
  for (const undo of release) undo()
  release = []
  clearConsent()
  setConsentStorage(undefined)
})

describe('requestDownload (FR-310, FR-311)', () => {
  it('sin un diálogo montado no descarga: responde false y no guarda nada', async () => {
    expect(hasConsentPresenter()).toBe(false)
    await expect(requestDownload(BASE)).resolves.toBe(false)
    expect(consentedKeys()).toEqual([])
  })

  it('pregunta con el recurso, el peso y el servidor, y guarda el sí en la sesión', async () => {
    const presenter = present(true)
    await expect(requestDownload(BASE)).resolves.toBe(true)
    expect(presenter).toHaveBeenCalledWith(BASE)
    expect(JSON.parse(storage.data.get(CONSENT_STORAGE_KEY) ?? '[]')).toEqual(['V1:Whisper base (int8)'])
    await expect(requestDownload(BASE)).resolves.toBe(true)
    expect(presenter).toHaveBeenCalledTimes(1)
  })

  it('"Ahora no" responde false, no guarda nada y la próxima vez vuelve a preguntar', async () => {
    const presenter = present(false)
    await expect(requestDownload(BASE)).resolves.toBe(false)
    expect(storage.data.has(CONSENT_STORAGE_KEY)).toBe(false)
    await requestDownload(BASE)
    expect(presenter).toHaveBeenCalledTimes(2)
  })

  it('vale por experimento y por recurso', async () => {
    present(true)
    await requestDownload(BASE)
    expect(hasConsent('V1', BASE.resource)).toBe(true)
    expect(hasConsent('V1', TINY.resource)).toBe(false)
    expect(hasConsent('V4', BASE.resource)).toBe(false)
  })

  it('dos pedidos iguales a la vez comparten un solo diálogo', async () => {
    let answer: (value: boolean) => void = () => {}
    const presenter = present(() => new Promise<boolean>((resolve) => (answer = resolve)))
    const first = requestDownload(BASE)
    const second = requestDownload(BASE)
    await Promise.resolve()
    answer(true)
    await expect(Promise.all([first, second])).resolves.toEqual([true, true])
    expect(presenter).toHaveBeenCalledTimes(1)
  })

  it('pedidos distintos esperan su turno: nunca hay dos diálogos abiertos', async () => {
    const open: string[] = []
    const answers: Array<(value: boolean) => void> = []
    present(
      (request) =>
        new Promise<boolean>((resolve) => {
          open.push(request.resource)
          answers.push(resolve)
        }),
    )
    const first = requestDownload(BASE)
    const second = requestDownload(TINY)
    await vi.waitFor(() => expect(open).toEqual([BASE.resource]))
    answers[0]?.(false)
    await expect(first).resolves.toBe(false)
    await vi.waitFor(() => expect(open).toEqual([BASE.resource, TINY.resource]))
    answers[1]?.(true)
    await expect(second).resolves.toBe(true)
  })

  it('un diálogo que falla cuenta como "Ahora no"', async () => {
    present(async () => {
      throw new Error('roto')
    })
    await expect(requestDownload(BASE)).resolves.toBe(false)
  })

  it('rechaza pedidos mal formados antes de preguntar', () => {
    const presenter = present(true)
    expect(() => requestDownload({ ...BASE, bytes: 0 })).toThrow(TypeError)
    expect(() => requestDownload({ ...BASE, bytes: 1.5 })).toThrow(TypeError)
    expect(() => requestDownload({ ...BASE, resource: ' ' })).toThrow(TypeError)
    expect(() => requestDownload({ ...BASE, host: 'evil.example' as DownloadRequest['host'] })).toThrow(TypeError)
    expect(() => requestDownload({ ...BASE, experiment: 'X9' as DownloadRequest['experiment'] })).toThrow(TypeError)
    expect(presenter).not.toHaveBeenCalled()
  })
})

describe('retirar el consentimiento (FR-311)', () => {
  it('se retira por recurso o por experimento, y avisa a quien escucha', async () => {
    present(true)
    await requestDownload(BASE)
    await requestDownload(TINY)
    await requestDownload({ ...BASE, experiment: 'V4' })
    const listener = vi.fn()
    const off = onConsentChange(listener)
    withdrawConsent('V1', TINY.resource)
    expect(consentedResources('V1')).toEqual([BASE.resource])
    withdrawConsent('V1')
    expect(consentedResources('V1')).toEqual([])
    expect(consentedResources('V4')).toEqual([BASE.resource])
    expect(listener).toHaveBeenCalledTimes(2)
    off()
    clearConsent()
    expect(listener).toHaveBeenCalledTimes(2)
    expect(consentedKeys()).toEqual([])
  })
})

describe('almacenamiento bloqueado (modo privado)', () => {
  it('sigue funcionando en memoria durante la sesión', async () => {
    setConsentStorage({
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
      removeItem: () => {
        throw new Error('bloqueado')
      },
    })
    const presenter = present(true)
    await expect(requestDownload(BASE)).resolves.toBe(true)
    await expect(requestDownload(BASE)).resolves.toBe(true)
    expect(presenter).toHaveBeenCalledTimes(1)
  })

  it('sin sessionStorage también', async () => {
    setConsentStorage(null)
    present(true)
    await requestDownload(BASE)
    expect(hasConsent('V1', BASE.resource)).toBe(true)
  })
})
