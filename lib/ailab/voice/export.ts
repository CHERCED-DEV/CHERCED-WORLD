import type { WhisperSegment } from './protocol'

export const SRT_MIN_CUE_SECONDS = 0.5

export type ExportFormat = 'txt' | 'srt'

export const EXPORT_TYPES: Readonly<Record<ExportFormat, string>> = {
  txt: 'text/plain;charset=utf-8',
  srt: 'application/x-subrip;charset=utf-8',
}

const pad = (value: number, size = 2) => String(value).padStart(size, '0')

function parts(seconds: number): { hours: number; minutes: number; secs: number; millis: number } {
  const total = Math.max(0, Math.round((Number.isFinite(seconds) ? seconds : 0) * 1000))
  return {
    hours: Math.floor(total / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    secs: Math.floor((total % 60_000) / 1000),
    millis: total % 1000,
  }
}

export function clock(seconds: number): string {
  const { hours, minutes, secs } = parts(Math.floor(Math.max(0, seconds)))
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${pad(minutes)}:${pad(secs)}`
}

export function srtTime(seconds: number): string {
  const { hours, minutes, secs, millis } = parts(seconds)
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(millis, 3)}`
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

function cues(segments: readonly WhisperSegment[]): WhisperSegment[] {
  const list = segments
    .map((segment) => ({ ...segment, text: cleanText(segment.text) }))
    .filter((segment) => segment.text !== '')
    .sort((a, b) => a.start - b.start)
  return list.map((segment, index) => {
    const next = list[index + 1]?.start
    const wanted = Math.max(segment.end, segment.start + SRT_MIN_CUE_SECONDS)
    const limit = next !== undefined && next > segment.start ? next : Number.POSITIVE_INFINITY
    const end = Math.max(Math.min(wanted, limit), segment.start + 0.001)
    return { start: segment.start, end, text: segment.text }
  })
}

export function toSrt(segments: readonly WhisperSegment[]): string {
  return cues(segments)
    .map((cue, index) => `${index + 1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}\n`)
    .join('\n')
}

export function toTxt(segments: readonly WhisperSegment[]): string {
  const lines = cues(segments).map((cue) => `[${clock(cue.start)} - ${clock(cue.end)}] ${cue.text.replace(/\n/g, ' ')}`)
  return lines.length > 0 ? `${lines.join('\n')}\n` : ''
}

export function plainText(segments: readonly WhisperSegment[]): string {
  return cues(segments)
    .map((cue) => cue.text.replace(/\n/g, ' '))
    .join(' ')
}

export function exportFileName(prefix: string, format: ExportFormat, date = new Date()): string {
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
  return `${prefix}-${stamp}.${format}`
}

export function downloadText(name: string, content: string, format: ExportFormat): void {
  const url = URL.createObjectURL(new Blob([content], { type: EXPORT_TYPES[format] }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
