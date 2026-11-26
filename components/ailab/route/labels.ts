import { t, type Dictionary } from '@/lib/i18n'

export type RouteMarkLabels = {
  legend: string
  checked: string
  failed: string
  untested: string
  notes: string
  hint: string
  next: string
}

export type RouteClockLabels = { label: string; idle: string; over: string; done: string }

export type RouteControlLabels = {
  controls: string
  start: string
  finish: string
  reset: string
  memory: string
  rail: string
  now: string
  count: string
  announceStart: string
  announceStation: string
  announceOver: string
  announceComplete: string
  announceReset: string
  timeLeft: string
  timeOver: string
  actaDownload: string
  actaHint: string
  actaFailed: string
  actaFile: string
  clock: RouteClockLabels
  marks: Pick<RouteMarkLabels, 'checked' | 'failed' | 'untested'>
}

export type StationCardLabels = {
  count: string
  minutes: string
  goal: string
  steps: string
  evidence: string
  links: string
  also: string
  spec: string
  external: string
  offline: string
}

export type BreakItLabels = { title: string; intro: string; copy: string; copyLabel: string; copied: string; copyFailed: string; more: string; board: string }

export type RecordedTraceLabels = { summary: string; note: string }

export type RoutePillLabels = { label: string; time: string; over: string; close: string; region: string }

export type RoutePageLabels = {
  back: string
  eyebrow: string
  title: string
  intro: string
  privacy: string
  noscript: string
  proof: string
  more: string
  controls: RouteControlLabels
  mark: RouteMarkLabels
  card: StationCardLabels
  breakIt: BreakItLabels
  trace: RecordedTraceLabels
}

export function routeMarkLabels(dict: Dictionary): RouteMarkLabels {
  return {
    legend: t(dict, 'route.mark.legend'),
    checked: t(dict, 'route.mark.checked'),
    failed: t(dict, 'route.mark.failed'),
    untested: t(dict, 'route.mark.untested'),
    notes: t(dict, 'route.notes.label'),
    hint: t(dict, 'route.notes.hint'),
    next: t(dict, 'route.station.next'),
  }
}

export function routePillLabels(dict: Dictionary): RoutePillLabels {
  return {
    label: t(dict, 'route.pill.label'),
    time: t(dict, 'route.pill.time'),
    over: t(dict, 'route.pill.over'),
    close: t(dict, 'route.pill.close'),
    region: t(dict, 'route.pill.region'),
  }
}

export function routePageLabels(dict: Dictionary): RoutePageLabels {
  const mark = routeMarkLabels(dict)
  return {
    back: t(dict, 'route.back'),
    eyebrow: t(dict, 'route.eyebrow'),
    title: t(dict, 'route.title'),
    intro: t(dict, 'route.intro'),
    privacy: t(dict, 'route.privacy'),
    noscript: t(dict, 'route.noscript'),
    proof: t(dict, 'route.proof.label'),
    more: t(dict, 'route.more'),
    controls: {
      controls: t(dict, 'route.controls'),
      start: t(dict, 'route.start'),
      finish: t(dict, 'route.finish'),
      reset: t(dict, 'route.reset'),
      memory: t(dict, 'route.memory'),
      rail: t(dict, 'route.rail.label'),
      now: t(dict, 'route.rail.now'),
      count: t(dict, 'route.station.count'),
      announceStart: t(dict, 'route.announce.start'),
      announceStation: t(dict, 'route.announce.station'),
      announceOver: t(dict, 'route.announce.over'),
      announceComplete: t(dict, 'route.announce.complete'),
      announceReset: t(dict, 'route.announce.reset'),
      timeLeft: t(dict, 'route.pill.time'),
      timeOver: t(dict, 'route.pill.over'),
      actaDownload: t(dict, 'route.acta.download'),
      actaHint: t(dict, 'route.acta.hint'),
      actaFailed: t(dict, 'route.acta.failed'),
      actaFile: t(dict, 'route.acta.file'),
      clock: {
        label: t(dict, 'route.clock.label'),
        idle: t(dict, 'route.clock.idle'),
        over: t(dict, 'route.clock.over'),
        done: t(dict, 'route.clock.done'),
      },
      marks: { checked: mark.checked, failed: mark.failed, untested: mark.untested },
    },
    mark,
    card: {
      count: t(dict, 'route.station.count'),
      minutes: t(dict, 'route.station.minutes'),
      goal: t(dict, 'route.station.goal'),
      steps: t(dict, 'route.station.steps'),
      evidence: t(dict, 'route.station.evidence'),
      links: t(dict, 'route.station.links'),
      also: t(dict, 'route.station.also'),
      spec: t(dict, 'route.station.spec'),
      external: t(dict, 'route.station.external'),
      offline: t(dict, 'route.station.offline'),
    },
    breakIt: {
      title: t(dict, 'route.breakit.title'),
      intro: t(dict, 'route.breakit.intro'),
      copy: t(dict, 'route.breakit.copy'),
      copyLabel: t(dict, 'route.breakit.copyLabel'),
      copied: t(dict, 'route.breakit.copied'),
      copyFailed: t(dict, 'route.breakit.copyFailed'),
      more: t(dict, 'route.breakit.more'),
      board: t(dict, 'route.breakit.board'),
    },
    trace: { summary: t(dict, 'route.trace.summary'), note: t(dict, 'route.trace.note') },
  }
}
