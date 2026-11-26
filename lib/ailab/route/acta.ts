import type { RouteProof } from '@/content/ailab/route/stations'
import { clock } from '@/lib/ai/agent/interview'
import type { Locale } from '@/lib/i18n/config'
import { elapsedMs, markOf, type RouteMark, type RouteProgress } from './progress'
import type { RouteProofView, RouteStationView } from './view'

export type RouteProofState = RouteMark | 'mixed'

export type RouteActaInput = {
  lang: Locale
  stations: readonly RouteStationView[]
  proofs: readonly RouteProofView[]
  progress: RouteProgress
  origin: string
  now: number
}

const ACTA_COPY = {
  es: {
    title: 'Acta de la ruta de 10 minutos',
    date: 'Fecha',
    duration: 'Duración',
    notStarted: 'la ruta no se empezó',
    route: 'Ruta',
    proof: 'Prueba',
    states: { checked: 'comprobada', failed: 'no funcionó', untested: 'sin probar', mixed: 'comprobada en parte' },
    core: 'estación núcleo',
    more: 'más pruebas',
    from: (proof: RouteProof) => `estación de la prueba ${proof}`,
    minutes: (minutes: number) => `${minutes} min`,
    station: 'Estación',
    experience: 'Experiencia',
    evidence: 'Evidencia que convenía llevarse',
    links: 'Enlaces de evidencia',
    notes: 'Notas',
    note: 'Esta acta la marcó quien entrevista, en su navegador: cada estado y cada nota son suyos. El sitio no la guarda, no la manda a ningún lado y no le pone puntaje a Camilo.',
  },
  en: {
    title: '10-minute route record',
    date: 'Date',
    duration: 'Duration',
    notStarted: 'the route was not started',
    route: 'Route',
    proof: 'Test',
    states: { checked: 'checked', failed: 'did not work', untested: 'not tested', mixed: 'partly checked' },
    core: 'core station',
    more: 'more tests',
    from: (proof: RouteProof) => `station from test ${proof}`,
    minutes: (minutes: number) => `${minutes} min`,
    station: 'Station',
    experience: 'Experience',
    evidence: 'Evidence worth taking',
    links: 'Evidence links',
    notes: 'Notes',
    note: 'This record was marked by the interviewer, in their browser: every status and every note is theirs. The site does not save it, send it anywhere or give Camilo a score.',
  },
} as const

function absolute(origin: string, href: string): string {
  return /^https?:\/\//.test(href) ? href : `${origin.replace(/\/+$/, '')}${href}`
}

function touched(progress: RouteProgress, station: RouteStationView): boolean {
  return markOf(progress, station.id) !== 'untested' || Boolean(progress.notes[station.id])
}

export function proofState(marks: readonly RouteMark[]): RouteProofState {
  const checked = marks.includes('checked')
  const failed = marks.includes('failed')
  if (checked && failed) return 'mixed'
  if (checked) return 'checked'
  if (failed) return 'failed'
  return 'untested'
}

export function routeActa(input: RouteActaInput): string {
  const copy = ACTA_COPY[input.lang]
  const { progress } = input
  const date = new Intl.DateTimeFormat(input.lang === 'es' ? 'es-CO' : 'en-US', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }).format(
    new Date(progress.startedAt ?? input.now),
  )
  const lines = [
    `# ${copy.title}`,
    '',
    `- **${copy.date}:** ${date}`,
    `- **${copy.duration}:** ${progress.startedAt === null ? copy.notStarted : clock(elapsedMs(progress, input.now))}`,
    `- **${copy.route}:** ${absolute(input.origin, `/${input.lang}/ai-lab/ruta`)}`,
  ]
  for (const { proof, title } of input.proofs) {
    const own = input.stations.filter((station) => station.proof === proof && (station.core || touched(progress, station)))
    const borrowed = input.stations.filter((station) => station.also.some((item) => item.proof === proof) && touched(progress, station))
    const state = proofState([...own, ...borrowed].map((station) => markOf(progress, station.id)))
    lines.push('', `## ${copy.proof} ${proof}. ${title}: ${copy.states[state]}`)
    for (const station of own) {
      const kind = [station.core ? copy.core : copy.more, copy.minutes(station.minutes), `spec ${station.spec}`].join(', ')
      lines.push(
        '',
        `### ${station.title}: ${copy.states[markOf(progress, station.id)]}`,
        '',
        `- **${copy.station}:** ${kind}`,
        `- **${copy.experience}:** [${station.action.label}](${absolute(input.origin, station.action.href)})`,
        `- **${copy.evidence}:** ${station.evidence.map((item) => item.text).join(' ')}`,
      )
      if (station.links.length) {
        lines.push(`- **${copy.links}:**`)
        for (const link of station.links) lines.push(`  - [${link.label}](${absolute(input.origin, link.href)})`)
      }
      const note = progress.notes[station.id]
      if (note) lines.push('', `**${copy.notes}:**`, '', note)
    }
    for (const station of borrowed) lines.push('', `- ${station.title} (${copy.from(station.proof)}): ${copy.states[markOf(progress, station.id)]}`)
  }
  lines.push('', `> ${copy.note}`, '')
  return lines.join('\n')
}

export function routeActaFileName(base: string, at: number): string {
  const date = new Date(at)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${base}-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.md`
}
