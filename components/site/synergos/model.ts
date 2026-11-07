import { formatFact, formatFloor, synergosFacts } from '@/content/synergos'
import {
  showcaseTasks,
  synergosShowcase,
  SYNERGOS_PATH,
  type ShowcaseLine,
  type ShowcaseLineState,
  type ShowcaseMilestoneState,
} from '@/content/synergos-showcase'
import { localizedPath, type Locale } from '@/lib/i18n'
import { formatNowDate } from '../now/model'
import { fillTemplate } from '../portfolio/carousel'

export type LabeledLineState = Exclude<ShowcaseLineState, 'closed'>

export const LINE_STATES: readonly LabeledLineState[] = ['active', 'paused']

export const MILESTONE_STATES: readonly ShowcaseMilestoneState[] = ['done', 'doing', 'todo']

const copy = synergosShowcase.copy

export function synergosHref(lang: Locale): string {
  return localizedPath(lang, SYNERGOS_PATH)
}

export function lineLabel(line: Pick<ShowcaseLine, 'id' | 'name'>, lang: Locale): string {
  return `${line.id} ${line.name[lang]}`
}

export function stateLabel(state: ShowcaseLineState, lang: Locale): string | null {
  return state === 'closed' ? null : copy.states[state][lang]
}

export function stateText(line: Pick<ShowcaseLine, 'state' | 'done' | 'total'>, lang: Locale): string {
  const label = stateLabel(line.state, lang)
  const progress = `${line.done}/${line.total}`
  return label ? `${label} · ${progress}` : progress
}

export function tasksText(line: Pick<ShowcaseLine, 'done' | 'total'>, lang: Locale): string {
  return fillTemplate(copy.verticals.tasks[lang], { done: line.done, total: line.total })
}

export function lineSummary(lines: readonly ShowcaseLine[], lang: Locale): string {
  const names = (state: ShowcaseLineState) =>
    new Intl.ListFormat(lang === 'es' ? 'es' : 'en', { type: 'conjunction' }).format(
      lines.filter((line) => line.state === state).map((line) => line.name[lang]),
    )
  return fillTemplate(copy.line.summary[lang], { active: names('active'), paused: names('paused') })
}

export function countedText(lang: Locale): { before: string; date: string; after: string } {
  const template = copy.figures.counted[lang]
  const index = template.indexOf('{date}')
  return { before: template.slice(0, index), date: formatNowDate(synergosShowcase.countedAt, lang), after: template.slice(index + '{date}'.length) }
}

export type FigureView = { id: 'lines' | 'tasks' | 'tests' | 'gates' | 'adrs'; value: string; accent?: string; label: string; note?: string }

export function showcaseFigures(lang: Locale): FigureView[] {
  const tasks = showcaseTasks()
  const figures = copy.figures
  return [
    { id: 'lines', value: String(synergosShowcase.lines.length), label: figures.lines[lang] },
    { id: 'tasks', accent: String(tasks.done), value: `/${tasks.total}`, label: figures.tasks[lang], note: figures.tasksNote[lang] },
    {
      id: 'tests',
      value: formatFloor(synergosFacts.testsAtLeast, lang),
      label: figures.tests[lang],
      note: fillTemplate(figures.testsNote[lang], { count: formatFact(synergosShowcase.testsCounted, lang) }),
    },
    { id: 'gates', value: String(synergosShowcase.gates), label: figures.gates[lang] },
    { id: 'adrs', value: formatFloor(synergosFacts.adrsAtLeast, lang), label: figures.adrs[lang] },
  ]
}

export type Lane = {
  id: string
  label: string
  state: ShowcaseLineState
  status: string
  ratio: number
  pulse: boolean
}

export function lanes(lines: readonly ShowcaseLine[], lang: Locale): Lane[] {
  return lines.map((line) => ({
    id: line.id,
    label: lineLabel(line, lang),
    state: line.state,
    status: stateText(line, lang),
    ratio: line.total > 0 ? Math.min(1, line.done / line.total) : 0,
    pulse: line.state === 'active',
  }))
}

export type LaneShape = Lane & {
  labelX: number
  labelY: number
  barX: number
  barY: number
  barWidth: number
  statusX: number
  statusY: number
  path: string
  delay: number
}

export type Hub = { cx: number; cy: number; r: number }

export type ReleaseBox = { x: number; y: number; width: number; height: number }

export type LineLayout = {
  width: number
  height: number
  lanes: LaneShape[]
  trunk: string | null
  director: Hub
  out: string
  release: ReleaseBox
}

export const PULSE_STEP = 0.4

function round(value: number): number {
  return Math.round(value * 10) / 10
}

function delays(items: readonly Lane[]): Map<string, number> {
  const map = new Map<string, number>()
  items.filter((lane) => lane.pulse).forEach((lane, index) => map.set(lane.id, round(-index * PULSE_STEP)))
  return map
}

export const WIDE = { width: 760, row: 36, top: 18, barWidth: 120, statusX: 128, startX: 272, hubX: 562, r: 38 } as const

export function wideLayout(items: readonly Lane[]): LineLayout {
  const { width, row, top, barWidth, statusX, startX, hubX, r } = WIDE
  const last = top + Math.max(0, items.length - 1) * row
  const cy = round((top + 4 + last + 4) / 2)
  const height = last + 24
  const offsets = delays(items)
  const shapes = items.map((lane, index): LaneShape => {
    const y = top + index * row
    const mid = y + 4
    return {
      ...lane,
      labelX: 0,
      labelY: y,
      barX: 0,
      barY: y + 7,
      barWidth,
      statusX,
      statusY: y + 11,
      path: `M${startX} ${mid} C ${startX + 138} ${mid}, ${startX + 168} ${cy}, ${hubX - r} ${cy}`,
      delay: offsets.get(lane.id) ?? 0,
    }
  })
  const releaseX = 652
  return {
    width,
    height,
    lanes: shapes,
    trunk: null,
    director: { cx: hubX, cy, r },
    out: `M${hubX + r} ${cy} L ${releaseX - 2} ${cy}`,
    release: { x: releaseX, y: cy - 36, width: width - releaseX - 2, height: 72 },
  }
}

export const TALL = { width: 260, row: 44, top: 18, labelX: 28, barWidth: 84, statusX: 120, stubX: 22, trunkX: 10, r: 38 } as const

export function tallLayout(items: readonly Lane[]): LineLayout {
  const { width, row, top, labelX, barWidth, statusX, stubX, trunkX, r } = TALL
  const last = top + Math.max(0, items.length - 1) * row
  const bend = last + 3 + 54
  const cx = width / 2
  const cy = bend + 32
  const tail = `V ${bend} C ${trunkX} ${cy - 10}, ${trunkX + 30} ${cy}, ${cx - r} ${cy}`
  const offsets = delays(items)
  const shapes = items.map((lane, index): LaneShape => {
    const y = top + index * row
    const mid = y + 3
    const stub = `M${stubX} ${mid} H ${trunkX}`
    return {
      ...lane,
      labelX,
      labelY: y,
      barX: labelX,
      barY: y + 9,
      barWidth,
      statusX,
      statusY: y + 13,
      path: lane.pulse ? `${stub} ${tail}` : stub,
      delay: offsets.get(lane.id) ?? 0,
    }
  })
  const releaseY = cy + r + 46
  return {
    width,
    height: releaseY + 74,
    lanes: shapes,
    trunk: items.length > 0 ? `M${trunkX} ${top + 3} ${tail}` : null,
    director: { cx, cy, r },
    out: `M${cx} ${cy + r} L ${cx} ${releaseY - 2}`,
    release: { x: cx - 56, y: releaseY, width: 112, height: 64 },
  }
}

export type RainDrop = { x: number; y: number; text: string }

const RAIN_GLYPHS = [...'アイウエオカキクケコ01<>{}']

export function rainDrops(count: number, seed = 7, width = 1200, height = 800): RainDrop[] {
  let state = seed >>> 0
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
  return Array.from({ length: count }, () => {
    const x = Math.floor(next() * width)
    const y = Math.floor(next() * height)
    const text = Array.from({ length: 8 }, () => RAIN_GLYPHS[Math.floor(next() * RAIN_GLYPHS.length)]).join('')
    return { x, y, text }
  })
}
