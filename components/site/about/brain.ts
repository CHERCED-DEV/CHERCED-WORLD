import type { Locale, Project, SiteContent } from '@/content/types'
import { clampLevel, formatPeriod } from '../format'

export type BrainSkill = { id: string; name: string; level: number; icon?: string }

export type BrainProject = { id: string; title: string }

export type BrainLobe = { id: string; name: string; skills: BrainSkill[]; sources: string[]; projects: BrainProject[] }

export type BrainSource = { id: string; label: string; title: string; detail: string; period: string | null }

export type BrainData = { lobes: BrainLobe[]; sources: BrainSource[] }

type SourceRef = { kind: 'education'; id: string; label: string } | { kind: 'course'; match: RegExp; label: Record<Locale, string> }

export const SOURCE_REFS: Record<string, SourceRef> = {
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

export const SOURCE_ORDER = ['platziMaster', 'architecture', 'fullStackJs', 'nextjs', 'unad', 'eam'] as const

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

export function resolveSource(id: string, about: SiteContent['about'], lang: Locale, presentLabel: string): BrainSource | null {
  const ref = SOURCE_REFS[id]
  if (!ref) return null
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
  if (tech) return { id, name: tech.name, level: clampLevel(tech.progress), ...(tech.icon ? { icon: tech.icon } : {}) }
  const language = about.languages.find((item) => item.id === id)
  if (language) return { id, name: language.name[lang].toUpperCase(), level: clampLevel(language.progress), ...(language.icon ? { icon: language.icon } : {}) }
  return null
}

export function brainData(about: SiteContent['about'], projects: readonly Project[], lang: Locale, presentLabel: string): BrainData {
  const lobes = (about.skills.lobes ?? []).map((lobe) => {
    const skills = lobe.skills.map((id) => resolveSkill(id, about, lang)).filter((skill): skill is BrainSkill => skill !== null)
    return {
      id: lobe.id,
      name: lobe.name[lang],
      skills,
      sources: lobe.sources.filter((source) => source in SOURCE_REFS),
      projects: projectsForSkills(skills, projects),
    }
  })
  const sources = SOURCE_ORDER.map((id) => resolveSource(id, about, lang, presentLabel)).filter(
    (source): source is BrainSource => source !== null,
  )
  return { lobes, sources }
}

export type Point = { x: number; y: number }

export const BRAIN_VIEW = { width: 800, height: 600 } as const

export const BRAIN_CORE: Point = { x: 400, y: 282 }

const LOBE_POINTS: readonly Point[] = [
  { x: 155, y: 150 },
  { x: 400, y: 92 },
  { x: 645, y: 150 },
  { x: 595, y: 440 },
  { x: 205, y: 440 },
]

export function lobePoint(index: number): Point {
  return LOBE_POINTS[index % LOBE_POINTS.length]!
}

export type NeuronGeometry = { synapse: string; neurons: Array<{ x: number; y: number; r: number; line: string }> }

function fixed(value: number): number {
  return Math.round(value * 10) / 10
}

export function neuronGeometry(index: number, levels: readonly number[]): NeuronGeometry {
  const lobe = lobePoint(index)
  const dx = lobe.x - BRAIN_CORE.x
  const dy = lobe.y - BRAIN_CORE.y
  const distance = Math.hypot(dx, dy) || 1
  const ux = dx / distance
  const uy = dy / distance
  const synapse = `M${fixed(BRAIN_CORE.x + ux * 70)} ${fixed(BRAIN_CORE.y + uy * 70)} Q${fixed((BRAIN_CORE.x + lobe.x) / 2 + dy * 0.18)} ${fixed(
    (BRAIN_CORE.y + lobe.y) / 2 - dx * 0.18,
  )} ${fixed(lobe.x - ux * 62)} ${fixed(lobe.y - uy * 62)}`
  const base = Math.atan2(dy, dx)
  const count = levels.length
  const neurons = levels.map((level, i) => {
    const angle = base + (i - (count - 1) / 2) * 0.46
    const radius = 112 + (i % 2) * 18
    const x = lobe.x + Math.cos(angle) * radius
    const y = lobe.y + Math.sin(angle) * radius
    return {
      x: fixed(x),
      y: fixed(y),
      r: fixed(2.5 + level / 24),
      line: `M${fixed(lobe.x + Math.cos(angle) * 62)} ${fixed(lobe.y + Math.sin(angle) * 62)} L${fixed(x - Math.cos(angle) * 8)} ${fixed(y - Math.sin(angle) * 8)}`,
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
