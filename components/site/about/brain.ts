import type { Locale, Project, SiteContent } from '@/content/types'
import { clampLevel, formatPeriod } from '../format'

export type BrainSkill = { id: string; name: string; level: number; icon?: string; used?: string }

export type BrainProject = { id: string; title: string }

export type BrainLobe = {
  id: string
  name: string
  skills: BrainSkill[]
  sources: string[]
  projects: BrainProject[]
  learning?: string
  words?: string
}

export const LEARNING_LOBE = 'applied-ai'

export type BrainSource = { id: string; label: string; title: string; detail: string | null; period: string | null }

export type BrainData = { lobes: BrainLobe[]; sources: BrainSource[] }

type SourceRef =
  | { kind: 'education'; id: string; label: string }
  | { kind: 'course'; match: RegExp; label: Record<Locale, string> }
  | { kind: 'company'; match: RegExp; label: string }
  | { kind: 'case'; label: string }

export const SOURCE_REFS: Record<string, SourceRef> = {
  sistecredito: { kind: 'company', match: /^Sistecrédito$/, label: 'Sistecrédito' },
  flyr: { kind: 'company', match: /^FLYR$/, label: 'FLYR' },
  newshore: { kind: 'company', match: /^Newshore\b/, label: 'Newshore' },
  synergos: { kind: 'company', match: /^Synergos\b/, label: 'Synergos' },
  squadra: { kind: 'company', match: /^Squadra Arquitectura$/, label: 'Squadra Arquitectura' },
  legalWorkspace: { kind: 'case', label: 'Legal workspace' },
  platziMaster: { kind: 'education', id: 'platzi', label: 'Platzi Master' },
  architecture: {
    kind: 'course',
    match: /^Software Architecture Fundamentals/,
    label: { es: 'Fundamentos de Arquitectura', en: 'Architecture Fundamentals' },
  },
  fullStackJs: { kind: 'course', match: /^Full Stack Developer with JavaScript/, label: { es: 'Full Stack JS', en: 'Full Stack JS' } },
  nextjs: { kind: 'course', match: /^Full Stack with Next\.js/, label: { es: 'Next.js', en: 'Next.js' } },
  unad: { kind: 'education', id: 'unad', label: 'UNAD' },
  eam: { kind: 'education', id: 'eam', label: 'EAM' },
}

export const SOURCE_ORDER = [
  'sistecredito',
  'flyr',
  'newshore',
  'synergos',
  'squadra',
  'legalWorkspace',
  'platziMaster',
  'architecture',
  'fullStackJs',
  'nextjs',
  'unad',
  'eam',
] as const

const TECH_ALIASES: Record<string, string[]> = {
  html5: ['HTML'],
  'spec-driven-development': ['SPEC KIT'],
}

export function techKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9#+]/g, '')
}

export function projectsForSkills(skills: ReadonlyArray<{ id: string; name: string }>, projects: readonly Project[]): BrainProject[] {
  const keys = new Set(skills.flatMap((skill) => [skill.name, ...(TECH_ALIASES[skill.id] ?? [])].map(techKey)))
  return [...projects]
    .sort((a, b) => a.order - b.order)
    .filter((project) => project.technologies.some((technology) => keys.has(techKey(technology))))
    .map((project) => ({ id: project.id, title: project.title }))
}

export function projectsById(ids: readonly string[], projects: readonly Project[]): BrainProject[] {
  return ids.flatMap((id) => {
    const project = projects.find((item) => item.id === id)
    return project ? [{ id: project.id, title: project.title }] : []
  })
}

export function resolveSource(id: string, about: SiteContent['about'], lang: Locale, presentLabel: string): BrainSource | null {
  const ref = SOURCE_REFS[id]
  if (!ref) return null
  if (ref.kind === 'case') return { id, label: ref.label, title: ref.label, detail: null, period: null }
  if (ref.kind === 'company') {
    const entries = about.career.filter((entry) => ref.match.test(entry.company))
    if (entries.length === 0) return null
    const start = entries.map((entry) => entry.start).sort()[0]!
    const end = entries.some((entry) => entry.end === null) ? null : entries.map((entry) => entry.end!).sort().at(-1)!
    return {
      id,
      label: ref.label,
      title: entries[0]!.company,
      detail: [...new Set(entries.map((entry) => entry.role[lang]))].join(' · '),
      period: formatPeriod(start, end, lang, presentLabel),
    }
  }
  if (ref.kind === 'education') {
    const entry = about.education.find((item) => item.id === ref.id)
    if (!entry) return null
    return {
      id,
      label: ref.label,
      title: entry.institution,
      detail: entry.degree[lang],
      period: formatPeriod(entry.start, entry.end, lang, presentLabel),
    }
  }
  const school = about.courses.schools.find((item) => ref.match.test(item.name.en))
  if (!school) return null
  return { id, label: ref.label[lang], title: school.name[lang], detail: school.description[lang], period: null }
}

function resolveSkill(id: string, about: SiteContent['about'], lang: Locale): BrainSkill | null {
  const tech = about.skills.tech.find((item) => item.id === id)
  if (tech) {
    return {
      id,
      name: tech.label?.[lang] ?? tech.name,
      level: clampLevel(tech.progress),
      ...(tech.icon ? { icon: tech.icon } : {}),
      ...(tech.used?.[lang] ? { used: tech.used[lang] } : {}),
    }
  }
  const language = about.languages.find((item) => item.id === id)
  if (language) return { id, name: language.name[lang].toUpperCase(), level: clampLevel(language.progress), ...(language.icon ? { icon: language.icon } : {}) }
  return null
}

export function brainData(about: SiteContent['about'], projects: readonly Project[], lang: Locale, presentLabel: string): BrainData {
  const lobes = (about.skills.lobes ?? []).map((lobe) => {
    const skills = lobe.skills.map((id) => resolveSkill(id, about, lang)).filter((skill): skill is BrainSkill => skill !== null)
    const learning = lobe.id === LEARNING_LOBE ? about.skills.learningNow?.[lang]?.trim() : undefined
    const words = lobe.words?.[lang]?.trim()
    return {
      id: lobe.id,
      name: lobe.name[lang],
      skills,
      sources: lobe.sources.filter((source) => source in SOURCE_REFS),
      projects: lobe.projects ? projectsById(lobe.projects, projects) : projectsForSkills(skills, projects),
      ...(learning ? { learning } : {}),
      ...(words ? { words } : {}),
    }
  })
  const sources = SOURCE_ORDER.map((id) => resolveSource(id, about, lang, presentLabel)).filter(
    (source): source is BrainSource => source !== null,
  )
  return { lobes, sources }
}

export type Point = { x: number; y: number }

export const BRAIN_VIEW = { width: 800, height: 600 } as const

export const BRAIN_CORE: Point = { x: 400, y: 300 }

export const LOBE_RADIUS = 60

const ORBIT = { rx: 268, ry: 176 }

const LOBE_ANGLES = [-150, -90, -30, 30, 90, 150]

const RINGS = [
  { radius: 76, capacity: 9 },
  { radius: 96, capacity: 10 },
  { radius: 116, capacity: 11 },
]

const SPREAD = (150 * Math.PI) / 180

function fixed(value: number): number {
  return Math.round(value * 10) / 10
}

export function lobePoint(index: number, total = LOBE_ANGLES.length): Point {
  const angle = total === LOBE_ANGLES.length ? LOBE_ANGLES[index % total]! : -90 + (360 / total) * index
  const radians = (angle * Math.PI) / 180
  return { x: fixed(BRAIN_CORE.x + Math.cos(radians) * ORBIT.rx), y: fixed(BRAIN_CORE.y + Math.sin(radians) * ORBIT.ry) }
}

export type NeuronGeometry = { synapse: string; neurons: Array<{ x: number; y: number; r: number; line: string }> }

export function neuronSlots(count: number): Array<{ ring: number; offset: number }> {
  const slots: Array<{ ring: number; offset: number }> = []
  let left = count
  for (let ring = 0; ring < RINGS.length && left > 0; ring++) {
    const take = Math.min(left, RINGS[ring]!.capacity)
    for (let i = 0; i < take; i++) slots.push({ ring, offset: take === 1 ? 0 : -SPREAD / 2 + (SPREAD * i) / (take - 1) })
    left -= take
  }
  return slots
}

export function neuronGeometry(index: number, levels: readonly number[], total = LOBE_ANGLES.length): NeuronGeometry {
  const lobe = lobePoint(index, total)
  const dx = lobe.x - BRAIN_CORE.x
  const dy = lobe.y - BRAIN_CORE.y
  const distance = Math.hypot(dx, dy) || 1
  const ux = dx / distance
  const uy = dy / distance
  const synapse = `M${fixed(BRAIN_CORE.x + ux * 70)} ${fixed(BRAIN_CORE.y + uy * 70)} Q${fixed((BRAIN_CORE.x + lobe.x) / 2 + dy * 0.16)} ${fixed(
    (BRAIN_CORE.y + lobe.y) / 2 - dx * 0.16,
  )} ${fixed(lobe.x - ux * (LOBE_RADIUS + 4))} ${fixed(lobe.y - uy * (LOBE_RADIUS + 4))}`
  const base = Math.atan2(dy, dx)
  const slots = neuronSlots(levels.length)
  const neurons = levels.map((level, i) => {
    const slot = slots[i]!
    const angle = base + slot.offset
    const radius = RINGS[slot.ring]!.radius
    const x = lobe.x + Math.cos(angle) * radius
    const y = lobe.y + Math.sin(angle) * radius
    const inner = slot.ring === 0 ? LOBE_RADIUS + 2 : RINGS[slot.ring - 1]!.radius + 6
    return {
      x: fixed(x),
      y: fixed(y),
      r: fixed(2 + level / 30),
      line: `M${fixed(lobe.x + Math.cos(angle) * inner)} ${fixed(lobe.y + Math.sin(angle) * inner)} L${fixed(x - Math.cos(angle) * 6)} ${fixed(y - Math.sin(angle) * 6)}`,
    }
  })
  return { synapse, neurons }
}

export const BAR_CELLS = 20

export function blockBar(level: number, cells = BAR_CELLS): { on: string; off: string } {
  const filled = Math.round((clampLevel(level) / 100) * cells)
  return { on: '█'.repeat(filled), off: '░'.repeat(cells - filled) }
}

export const DECODE_GLYPHS = 'アイウエオカキクケコサシスセソ0123456789<>/{}=+*#'

export function decodeFrame(text: string, frame: number, total: number, random: () => number = Math.random): string {
  if (frame >= total) return text
  const revealed = (frame / total) * text.length
  return [...text]
    .map((char, index) => (char === ' ' || index < revealed ? char : DECODE_GLYPHS[Math.floor(random() * DECODE_GLYPHS.length)]!))
    .join('')
}
