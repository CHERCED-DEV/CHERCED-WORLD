import { describe, expect, it } from 'vitest'
import { RECORDING_TYPES, micIssue, micPermission, micSupported, pickRecordingType } from '@/lib/ailab/voice/recorder'

const fn = () => {}

describe('estados del micrófono (T722)', () => {
  it('sin getUserMedia, sin MediaRecorder o fuera de un contexto seguro, el navegador no puede grabar', () => {
    expect(micSupported({ isSecureContext: true, navigator: { mediaDevices: { getUserMedia: fn } }, MediaRecorder: fn })).toBe(true)
    expect(micSupported({ isSecureContext: false, navigator: { mediaDevices: { getUserMedia: fn } }, MediaRecorder: fn })).toBe(false)
    expect(micSupported({ isSecureContext: true, navigator: {}, MediaRecorder: fn })).toBe(false)
    expect(micSupported({ isSecureContext: true, navigator: { mediaDevices: { getUserMedia: fn } } })).toBe(false)
    expect(micSupported({})).toBe(false)
  })

  it.each([
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['SecurityError', 'denied'],
    ['NotFoundError', 'no-mic'],
    ['DevicesNotFoundError', 'no-mic'],
    ['OverconstrainedError', 'no-mic'],
    ['NotReadableError', 'busy'],
    ['AbortError', 'busy'],
    ['NotSupportedError', 'unsupported'],
    ['TypeError', 'error'],
  ])('%s → %s', (name, issue) => {
    expect(micIssue(new DOMException('x', name))).toBe(issue)
  })

  it('un error sin nombre es un error genérico', () => {
    expect(micIssue(null)).toBe('error')
    expect(micIssue('falló')).toBe('error')
  })

  it('elige el primer formato de grabación que el navegador soporta', () => {
    expect(pickRecordingType((type) => type === 'audio/mp4')).toBe('audio/mp4')
    expect(pickRecordingType((type) => type.startsWith('audio/webm'))).toBe(RECORDING_TYPES[0])
    expect(pickRecordingType(() => false)).toBeUndefined()
    expect(pickRecordingType(undefined)).toBeUndefined()
    expect(
      pickRecordingType(() => {
        throw new Error('raro')
      }),
    ).toBeUndefined()
  })

  it('lee el permiso sin pedirlo, y si el navegador no sabe, responde null', async () => {
    const granted = { navigator: { permissions: { query: async () => ({ state: 'denied' }) } } }
    expect(await micPermission(granted)).toBe('denied')
    expect(await micPermission({ navigator: { permissions: { query: async () => Promise.reject(new TypeError('microphone')) } } })).toBeNull()
    expect(await micPermission({ navigator: {} })).toBeNull()
  })
})
