import { describe, expect, it } from 'vitest'
import { SRT_MIN_CUE_SECONDS, clock, exportFileName, plainText, srtTime, toSrt, toTxt } from '@/lib/ailab/voice/export'
import type { WhisperSegment } from '@/lib/ailab/voice/protocol'

const CUE = /^(\d+)\n(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})\n([^\n]+(?:\n[^\n]+)*)$/

function seconds(h: string, m: string, s: string, ms: string): number {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms) / 1000
}

function parseSrt(srt: string): Array<{ index: number; start: number; end: number; text: string }> {
  expect(srt.endsWith('\n'), 'el archivo termina en salto de línea').toBe(true)
  return srt
    .trimEnd()
    .split('\n\n')
    .map((block) => {
      const match = CUE.exec(block)
      expect(match, `bloque SRT válido:\n${block}`).not.toBeNull()
      const [, index, h1, m1, s1, ms1, h2, m2, s2, ms2, text] = match!
      return { index: Number(index), start: seconds(h1!, m1!, s1!, ms1!), end: seconds(h2!, m2!, s2!, ms2!), text: text! }
    })
}

const SEGMENTS: WhisperSegment[] = [
  { start: 0, end: 4.2, text: ' Hola, esta es una prueba del transcriptor. ' },
  { start: 4.2, end: 9.876, text: 'Corre en el navegador, con Whisper.' },
  { start: 3725.5, end: 3729.25, text: 'Una hora después.' },
]

describe('marcas de tiempo (T721)', () => {
  it('srtTime usa HH:MM:SS,mmm con milisegundos redondeados', () => {
    expect(srtTime(0)).toBe('00:00:00,000')
    expect(srtTime(9.876)).toBe('00:00:09,876')
    expect(srtTime(61.0004)).toBe('00:01:01,000')
    expect(srtTime(3725.5)).toBe('01:02:05,500')
    expect(srtTime(-3)).toBe('00:00:00,000')
    expect(srtTime(Number.NaN)).toBe('00:00:00,000')
  })

  it('clock muestra mm:ss y suma la hora cuando hace falta', () => {
    expect(clock(0)).toBe('00:00')
    expect(clock(31.9)).toBe('00:31')
    expect(clock(600)).toBe('10:00')
    expect(clock(3725.5)).toBe('1:02:05')
  })
})

describe('exportar .srt (FR-350, US2 escenario 2)', () => {
  it('genera cues numerados desde 1, en orden, con el texto limpio y separados por una línea en blanco', () => {
    const cues = parseSrt(toSrt(SEGMENTS))
    expect(cues.map((cue) => cue.index)).toEqual([1, 2, 3])
    expect(cues.map((cue) => cue.text)).toEqual(['Hola, esta es una prueba del transcriptor.', 'Corre en el navegador, con Whisper.', 'Una hora después.'])
    expect(cues[1]).toMatchObject({ start: 4.2, end: 9.876 })
    expect(cues[2]).toMatchObject({ start: 3725.5, end: 3729.25 })
  })

  it('cada cue termina después de empezar y no pisa al siguiente', () => {
    const tight: WhisperSegment[] = [
      { start: 2, end: 2, text: 'uno' },
      { start: 2.2, end: 3, text: 'dos' },
      { start: 5, end: 4, text: 'tres' },
    ]
    const cues = parseSrt(toSrt(tight))
    for (const [index, cue] of cues.entries()) {
      expect(cue.end, cue.text).toBeGreaterThan(cue.start)
      const next = cues[index + 1]
      if (next) expect(cue.end, cue.text).toBeLessThanOrEqual(next.start)
    }
    expect(cues[0]?.end).toBe(2.2)
    expect(cues[2]?.end).toBe(5 + SRT_MIN_CUE_SECONDS)
  })

  it('ordena por inicio, descarta fragmentos vacíos y no deja líneas en blanco dentro de un cue', () => {
    const messy: WhisperSegment[] = [
      { start: 8, end: 9, text: 'después' },
      { start: 1, end: 2, text: '   ' },
      { start: 0, end: 1, text: 'antes\n\n  con salto' },
    ]
    const srt = toSrt(messy)
    const cues = parseSrt(srt)
    expect(cues.map((cue) => cue.text)).toEqual(['antes\ncon salto', 'después'])
    expect(srt.split('\n\n')).toHaveLength(2)
  })

  it('sin fragmentos, el archivo queda vacío', () => {
    expect(toSrt([])).toBe('')
    expect(toTxt([])).toBe('')
  })
})

describe('exportar .txt y copiar', () => {
  it('una línea por fragmento, con su inicio y su fin', () => {
    expect(toTxt(SEGMENTS)).toBe(
      ['[00:00 - 00:04] Hola, esta es una prueba del transcriptor.', '[00:04 - 00:09] Corre en el navegador, con Whisper.', '[1:02:05 - 1:02:09] Una hora después.', ''].join(
        '\n',
      ),
    )
  })

  it('el texto plano une los fragmentos sin marcas', () => {
    expect(plainText(SEGMENTS)).toBe('Hola, esta es una prueba del transcriptor. Corre en el navegador, con Whisper. Una hora después.')
  })

  it('el nombre del archivo lleva el prefijo del idioma, la fecha y la extensión', () => {
    const date = new Date(2026, 10, 5, 9, 7)
    expect(exportFileName('transcripcion', 'srt', date)).toBe('transcripcion-2026-11-05-0907.srt')
    expect(exportFileName('transcript', 'txt', date)).toBe('transcript-2026-11-05-0907.txt')
  })
})
