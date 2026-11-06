import type { LabTranslate } from '@/components/ailab/shell/types'
import type { BrainLabels } from './BrainPanel'

type Score = { you: number; rival: number }

export type RallyLabels = {
  game: string
  help: string
  you: string
  rival: string
  scoreLabel: (score: Score) => string
  meta: (game: number, rally: number) => string
  point: { you: (score: Score) => string; rival: (score: Score) => string }
  won: { you: (score: Score, next: number) => string; rival: (score: Score, next: number) => string }
  play: string
  serve: string
  pause: string
  resume: string
  overlay: { start: string; serve: string; paused: string }
  paused: string
  watch: string
  watching: string
  reset: string
  resetDone: string
  fresh: string
  keepLearning: string
  slow: string
  brain: BrainLabels & { actionsAcross: readonly string[] }
  curve: { title: string; axis: string; empty: string }
  shared: { hidden: string; evicted: string; storage: string }
}

export type RivalLabels = RallyLabels & {
  learning: string
  learned: (rallies: number) => string
  restored: (rallies: number) => string
  summary: (first: number, recent: number, window: number, rallies: number) => string
  firstRally: (first: number) => string
}

export type CloneLabels = RallyLabels & {
  sparring: string
  restored: (similarity: number) => string
  record: (rally: number, total: number) => string
  training: (samples: number) => string
  ready: (similarity: number) => string
  similarity: string
  similarityHelp: (similarity: number) => string
  rerecord: string
  summary: (first: number, recent: number, epochs: number) => string
}

function shared(t: LabTranslate): RallyLabels['shared'] {
  return { hidden: t('ailab.worker.paused'), evicted: t('ailab.worker.evicted'), storage: t('ailab.storage.unavailable') }
}

export function rivalLabels(t: LabTranslate): RivalLabels {
  return {
    game: t('ailab.j1.game'),
    help: t('ailab.j1.help'),
    you: t('ailab.j1.you'),
    rival: t('ailab.j1.rival'),
    scoreLabel: ({ you, rival }) => t('ailab.j1.score', { you, rival }),
    meta: (game, rally) => t('ailab.j1.meta', { game, rally }),
    point: {
      you: ({ you, rival }) => t('ailab.j1.point.you', { you, rival }),
      rival: ({ you, rival }) => t('ailab.j1.point.rival', { you, rival }),
    },
    won: {
      you: ({ you, rival }, next) => t('ailab.j1.won.you', { you, rival, next }),
      rival: ({ you, rival }, next) => t('ailab.j1.won.rival', { you, rival, next }),
    },
    play: t('ailab.j1.play'),
    serve: t('ailab.j1.serve'),
    pause: t('ailab.j1.pause'),
    resume: t('ailab.j1.resume'),
    overlay: { start: t('ailab.j1.overlay.start'), serve: t('ailab.j1.overlay.serve'), paused: t('ailab.j1.overlay.paused') },
    paused: t('ailab.j1.paused'),
    watch: t('ailab.j1.watch'),
    watching: t('ailab.j1.watching'),
    reset: t('ailab.j1.reset'),
    resetDone: t('ailab.j1.reset.done'),
    fresh: t('ailab.j1.fresh'),
    keepLearning: t('ailab.j1.keepLearning'),
    slow: t('ailab.j1.slow'),
    learning: t('ailab.j1.learning'),
    learned: (rallies) => t('ailab.j1.learned', { rallies }),
    restored: (rallies) => t('ailab.j1.restored', { rallies }),
    summary: (first, recent, window, rallies) => t('ailab.j1.curve.summary', { first, recent, window, rallies }),
    firstRally: (first) => t('ailab.j1.curve.first', { first }),
    brain: {
      title: t('ailab.j1.brain'),
      caption: t('ailab.j1.brain.caption'),
      idle: t('ailab.j1.brain.idle'),
      decision: (action, confidence) => t('ailab.j1.brain.decision', { action, confidence }),
      actions: [t('ailab.j1.action.up'), t('ailab.j1.action.stay'), t('ailab.j1.action.down')],
      actionsAcross: [t('ailab.j1.action.left'), t('ailab.j1.action.stay'), t('ailab.j1.action.right')],
      senses: [
        t('ailab.j1.sense.ball'),
        t('ailab.j1.sense.arrival'),
        t('ailab.j1.sense.coming'),
        t('ailab.j1.sense.distance'),
        t('ailab.j1.sense.angle'),
        t('ailab.j1.sense.paddle'),
      ],
    },
    curve: { title: t('ailab.j1.curve'), axis: t('ailab.j1.curve.axis'), empty: t('ailab.j1.curve.empty') },
    shared: shared(t),
  }
}

export function cloneLabels(t: LabTranslate): CloneLabels {
  return {
    game: t('ailab.j2.game'),
    help: t('ailab.j2.help'),
    you: t('ailab.j2.you'),
    rival: t('ailab.j2.rival'),
    sparring: t('ailab.j2.sparring'),
    scoreLabel: ({ you, rival }) => t('ailab.j2.score', { you, rival }),
    meta: (game, rally) => t('ailab.j2.meta', { game, rally }),
    point: {
      you: ({ you, rival }) => t('ailab.j2.point.you', { you, rival }),
      rival: ({ you, rival }) => t('ailab.j2.point.rival', { you, rival }),
    },
    won: {
      you: ({ you, rival }, next) => t('ailab.j2.won.you', { you, rival, next }),
      rival: ({ you, rival }, next) => t('ailab.j2.won.rival', { you, rival, next }),
    },
    play: t('ailab.j2.play'),
    serve: t('ailab.j2.serve'),
    pause: t('ailab.j2.pause'),
    resume: t('ailab.j2.resume'),
    overlay: { start: t('ailab.j2.overlay.start'), serve: t('ailab.j2.overlay.serve'), paused: t('ailab.j2.overlay.paused') },
    paused: t('ailab.j2.paused'),
    watch: t('ailab.j2.watch'),
    watching: t('ailab.j2.watching'),
    reset: t('ailab.j2.reset'),
    resetDone: t('ailab.j2.reset.done'),
    fresh: t('ailab.j2.fresh'),
    keepLearning: t('ailab.j2.keepLearning'),
    slow: t('ailab.j2.slow'),
    restored: (similarity) => t('ailab.j2.restored', { similarity }),
    record: (rally, total) => t('ailab.j2.record', { rally, total }),
    training: (samples) => t('ailab.j2.training', { samples }),
    ready: (similarity) => t('ailab.j2.ready', { similarity }),
    similarity: t('ailab.j2.similarity'),
    similarityHelp: (similarity) => t('ailab.j2.similarity.help', { similarity }),
    rerecord: t('ailab.j2.rerecord'),
    summary: (first, recent, epochs) => t('ailab.j2.curve.summary', { first, recent, epochs }),
    brain: {
      title: t('ailab.j2.brain'),
      caption: t('ailab.j2.brain.caption'),
      idle: t('ailab.j2.brain.idle'),
      decision: (action, confidence) => t('ailab.j2.brain.decision', { action, confidence }),
      actions: [t('ailab.j2.action.up'), t('ailab.j2.action.stay'), t('ailab.j2.action.down')],
      actionsAcross: [t('ailab.j2.action.left'), t('ailab.j2.action.stay'), t('ailab.j2.action.right')],
      senses: [
        t('ailab.j2.sense.ball'),
        t('ailab.j2.sense.arrival'),
        t('ailab.j2.sense.coming'),
        t('ailab.j2.sense.distance'),
        t('ailab.j2.sense.angle'),
        t('ailab.j2.sense.paddle'),
      ],
    },
    curve: { title: t('ailab.j2.curve'), axis: t('ailab.j2.curve.axis'), empty: t('ailab.j2.curve.empty') },
    shared: shared(t),
  }
}
