import { describe, expect, it } from 'vitest'
import {
  clearProgress,
  EMPTY_PROGRESS,
  elapsedMs,
  finishRoute,
  formatClock,
  isRouteActive,
  markOf,
  nextStation,
  parseProgress,
  pillVisible,
  readProgress,
  remainingMs,
  ROUTE_BUDGET_MS,
  ROUTE_NOTE_MAX,
  ROUTE_PROGRESS_KEY,
  serializeProgress,
  setActive,
  setMark,
  setNote,
  setPill,
  startRoute,
  writeProgress,
  type RouteStorage,
} from '@/lib/ailab/route/progress'

const ORDER = ['agente-en-vivo', 'encaje-y-pitch', 'codigo-real', 'de-spec-a-commit']
const T0 = Date.parse('2026-11-26T15:00:00Z')

function memoryStorage(): RouteStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

const blocked: RouteStorage = {
  getItem: () => {
    throw new DOMException('blocked', 'SecurityError')
  },
  setItem: () => {
    throw new DOMException('blocked', 'SecurityError')
  },
  removeItem: () => {
    throw new DOMException('blocked', 'SecurityError')
  },
}

describe('avance de la ruta en sessionStorage (FR-4204, FR-4205)', () => {
  it('guarda y lee el avance con su versión, y una versión distinta arranca de cero', () => {
    const storage = memoryStorage()
    const started = startRoute(EMPTY_PROGRESS, T0, ORDER)
    expect(writeProgress(storage, started)).toBe(true)
    expect(JSON.parse(storage.data.get(ROUTE_PROGRESS_KEY)!)).toMatchObject({ version: 1, startedAt: T0, active: 'agente-en-vivo' })
    expect(readProgress(storage)).toEqual(started)
    storage.setItem(ROUTE_PROGRESS_KEY, JSON.stringify({ ...started, version: 2 }))
    expect(readProgress(storage)).toEqual(EMPTY_PROGRESS)
  })

  it('con sessionStorage bloqueado no falla: lee la ruta vacía y avisa que no pudo guardar', () => {
    expect(readProgress(blocked)).toEqual(EMPTY_PROGRESS)
    expect(writeProgress(blocked, startRoute(EMPTY_PROGRESS, T0, ORDER))).toBe(false)
    expect(clearProgress(blocked)).toBe(false)
    expect(readProgress(null)).toEqual(EMPTY_PROGRESS)
    expect(writeProgress(null, EMPTY_PROGRESS)).toBe(false)
  })

  it('un avance roto o manipulado arranca de cero o se limpia sin error', () => {
    expect(parseProgress('{no es json')).toEqual(EMPTY_PROGRESS)
    expect(parseProgress('[]')).toEqual(EMPTY_PROGRESS)
    const dirty = parseProgress(
      JSON.stringify({
        version: 1,
        startedAt: T0,
        endedAt: 'ayer',
        active: '<script>',
        marks: { 'codigo-real': 'checked', 'de-spec-a-commit': 'genial', '../x': 'failed' },
        notes: { 'codigo-real': 'x'.repeat(900), 'encaje-y-pitch': 42 },
        pill: 'sí',
      }),
    )
    expect(dirty).toEqual({ version: 1, startedAt: T0, endedAt: null, active: null, marks: { 'codigo-real': 'checked' }, notes: { 'codigo-real': 'x'.repeat(ROUTE_NOTE_MAX) }, pill: true })
  })

  it('las marcas son comprobada, no funcionó o sin probar, y sin marca es sin probar', () => {
    let progress = startRoute(EMPTY_PROGRESS, T0, ORDER)
    expect(markOf(progress, 'codigo-real')).toBe('untested')
    progress = setMark(progress, 'codigo-real', 'failed', ORDER)
    expect(markOf(progress, 'codigo-real')).toBe('failed')
    progress = setMark(progress, 'codigo-real', 'untested', ORDER)
    expect(markOf(progress, 'codigo-real')).toBe('untested')
    expect(progress.marks).toEqual({})
  })

  it('US1: al marcar la estación activa, la ruta avanza a la siguiente sin marca; fuera de orden no salta', () => {
    let progress = startRoute(EMPTY_PROGRESS, T0, ORDER)
    progress = setMark(progress, 'agente-en-vivo', 'checked', ORDER)
    expect(progress.active).toBe('encaje-y-pitch')
    progress = setMark(progress, 'codigo-real', 'checked', ORDER)
    expect(progress.active).toBe('encaje-y-pitch')
    progress = setMark(progress, 'encaje-y-pitch', 'failed', ORDER)
    expect(progress.active).toBe('de-spec-a-commit')
    progress = setMark(progress, 'rompelo', 'checked', ORDER)
    expect(progress.active).toBe('de-spec-a-commit')
    progress = setMark(progress, 'de-spec-a-commit', 'checked', ORDER)
    expect(progress.active).toBeNull()
    expect(nextStation(ORDER, { 'encaje-y-pitch': 'checked' }, 'de-spec-a-commit')).toBe('agente-en-vivo')
  })

  it('abrir una estación la vuelve la activa solo con la ruta en marcha', () => {
    expect(setActive(EMPTY_PROGRESS, 'codigo-real')).toBe(EMPTY_PROGRESS)
    const progress = setActive(startRoute(EMPTY_PROGRESS, T0, ORDER), 'codigo-real')
    expect(progress.active).toBe('codigo-real')
  })

  it('las notas se recortan a 500 caracteres y una nota vacía se borra', () => {
    let progress = setNote(EMPTY_PROGRESS, 'codigo-real', 'a'.repeat(ROUTE_NOTE_MAX + 40))
    expect(progress.notes['codigo-real']).toHaveLength(ROUTE_NOTE_MAX)
    progress = setNote(progress, 'codigo-real', 'Explicó el límite de 1.500 líneas.\nBien.')
    expect(progress.notes['codigo-real']).toBe('Explicó el límite de 1.500 líneas.\nBien.')
    progress = setNote(progress, 'codigo-real', '')
    expect(progress.notes).toEqual({})
  })

  it('el reloj cuenta 10:00 hacia abajo y sigue en negativo sin bloquear la ruta', () => {
    const progress = startRoute(EMPTY_PROGRESS, T0, ORDER)
    expect(formatClock(remainingMs(EMPTY_PROGRESS, T0))).toBe('10:00')
    expect(formatClock(remainingMs(progress, T0 + 3 * 60_000 + 28_000))).toBe('06:32')
    expect(formatClock(remainingMs(progress, T0 + ROUTE_BUDGET_MS))).toBe('00:00')
    expect(formatClock(remainingMs(progress, T0 + ROUTE_BUDGET_MS + 83_000))).toBe('−01:23')
    expect(isRouteActive(progress)).toBe(true)
    expect(setMark(progress, 'codigo-real', 'checked', ORDER).marks).toEqual({ 'codigo-real': 'checked' })
  })

  it('terminar congela la duración y reiniciar vuelve a cero', () => {
    const started = startRoute(EMPTY_PROGRESS, T0, ORDER)
    const done = finishRoute(started, T0 + 9 * 60_000 + 41_000)
    expect(isRouteActive(done)).toBe(false)
    expect(elapsedMs(done, T0 + 60 * 60_000)).toBe(9 * 60_000 + 41_000)
    expect(startRoute(done, T0 + 1, ORDER)).toBe(done)
    const storage = memoryStorage()
    writeProgress(storage, done)
    expect(clearProgress(storage)).toBe(true)
    expect(readProgress(storage)).toEqual(EMPTY_PROGRESS)
  })

  it('FR-4211: la pastilla sale solo con una ruta activa, fuera de la ruta y si no la cerraron', () => {
    const started = startRoute(EMPTY_PROGRESS, T0, ORDER)
    expect(pillVisible(EMPTY_PROGRESS, '/es/ai-lab')).toBe(false)
    expect(pillVisible(started, '/es/ai-lab')).toBe(true)
    expect(pillVisible(started, '/en/portfolio/12')).toBe(true)
    expect(pillVisible(started, '/es/ai-lab/ruta')).toBe(false)
    expect(pillVisible(setPill(started, false), '/es/ai-lab')).toBe(false)
    expect(pillVisible(finishRoute(started, T0 + 1000), '/es/ai-lab')).toBe(false)
  })

  it('el avance se serializa sin nada más que lo que marcó el visitante', () => {
    const progress = setNote(setMark(startRoute(EMPTY_PROGRESS, T0, ORDER), 'agente-en-vivo', 'checked', ORDER), 'agente-en-vivo', 'ok')
    expect(Object.keys(JSON.parse(serializeProgress(progress))).sort()).toEqual(['active', 'endedAt', 'marks', 'notes', 'pill', 'startedAt', 'version'])
  })
})
