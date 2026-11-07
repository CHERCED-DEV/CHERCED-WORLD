import { createDemoRecorder, recordMove, type DemoRecorder } from './clone'
import { NET_SIZES, createTrace, forward, sample, seededRandom, type Net, type Random, type Trace } from './net'
import { PLAYER_AUTO_SERVE, createRally, heading, returnRate, step, type RallyState, type Side, type StepEvents } from './physics'
import { DECIDE_EVERY, SENSES, coachIntent, createCoach, intentOf, potential, senses, type Coach } from './policy'
import {
  HIT_REWARD,
  MISS_PENALTY,
  createEpisodeBuilder,
  finishEpisode,
  recordDecision,
  rewardEvent,
  type Episode,
  type EpisodeBuilder,
} from './rival'

export type PlayerDriver = 'human' | 'coach'

export type RivalDriver = 'net' | 'coach'

export type RallyOutcome = {
  rally: number
  winner: Side
  rate: number | null
  hits: number
  chances: number
  game: Side | null
  score: Record<Side, number>
  episodes: Episode[]
}

export type MatchOptions = {
  seed?: number
  net?: Net | null
  rivalDriver?: RivalDriver
  playerDriver?: PlayerDriver
  learn?: boolean
  record?: boolean
  coachSkill?: number
  sparringSkill?: number
}

export const MAX_EPISODE_DECISIONS = 900

export const COACH_SERVE_AFTER = 0.6

export class Match {
  readonly state: RallyState
  trace: Trace
  readonly recorder: DemoRecorder
  net: Net | null
  rivalDriver: RivalDriver
  playerDriver: PlayerDriver
  learn: boolean
  record: boolean
  readonly human = { intent: 0, serve: false }
  action = 1
  decisions = 0
  decided = false
  private ticks = 0
  private rivalIntent = 0
  private playerIntent = 0
  private readonly random: Random
  private readonly playerCoach: Coach
  private readonly rivalCoach: Coach
  private readonly builder: EpisodeBuilder
  private readonly input = new Float32Array(SENSES)
  private episodes: Episode[] = []
  private outcomes: RallyOutcome[] = []

  constructor(options: MatchOptions = {}) {
    const seed = options.seed ?? 1
    this.state = createRally(seed)
    this.net = options.net ?? null
    this.rivalDriver = options.rivalDriver ?? 'net'
    this.playerDriver = options.playerDriver ?? 'human'
    this.learn = options.learn ?? false
    this.record = options.record ?? false
    this.random = seededRandom(seed * 7919 + 17)
    this.playerCoach = createCoach(options.coachSkill ?? 0.88)
    this.rivalCoach = createCoach(options.sparringSkill ?? 0.8)
    this.builder = createEpisodeBuilder()
    this.recorder = createDemoRecorder()
    this.trace = createTrace(this.net ?? { sizes: [...NET_SIZES] })
  }

  setNet(net: Net | null): void {
    this.net = net
    this.trace = createTrace(net ?? { sizes: [...NET_SIZES] })
  }

  resetEpisode(): void {
    finishEpisode(this.builder)
    this.episodes = []
  }

  private decide(): void {
    const { state } = this
    if (this.rivalDriver === 'net' && this.net) {
      senses(state, 'rival', this.input)
      forward(this.net, this.input, this.trace)
      this.action = sample(this.trace.probs, this.random)
      this.rivalIntent = intentOf(this.action)
      this.decided = true
      this.decisions += 1
      if (this.learn && state.phase === 'play') {
        recordDecision(this.builder, this.input, this.action, potential(state, 'rival'), heading(state.ball) === 'rival' ? 1 : 0)
        if (this.builder.actions.length >= MAX_EPISODE_DECISIONS) this.flush()
      }
    } else {
      this.rivalIntent = coachIntent(state, 'rival', this.rivalCoach, this.random)
    }
    if (this.playerDriver === 'coach') this.playerIntent = coachIntent(state, 'player', this.playerCoach, this.random)
    if (this.record && this.playerDriver === 'human') recordMove(this.recorder, state)
  }

  private flush(): void {
    const episode = finishEpisode(this.builder)
    if (episode) this.episodes.push(episode)
  }

  tick(): StepEvents {
    const { state } = this
    if (this.ticks % DECIDE_EVERY === 0) this.decide()
    const coachServe = state.phase === 'serve' && state.server === 'player' && state.timer < PLAYER_AUTO_SERVE - COACH_SERVE_AFTER
    const serve = this.playerDriver === 'human' ? this.human.serve : coachServe
    this.human.serve = false
    const intent = this.playerDriver === 'human' ? this.human.intent : this.playerIntent
    const hitsBefore = state.hits.rival
    const events = step(state, { player: intent, rival: this.rivalIntent, serve })
    this.ticks += 1
    if (this.learn && events.hit === 'rival' && state.hits.rival > hitsBefore) rewardEvent(this.builder, HIT_REWARD)
    if (events.point) {
      if (this.learn && events.point === 'player') rewardEvent(this.builder, MISS_PENALTY)
      if (this.learn) this.flush()
      this.outcomes.push({
        rally: state.rally,
        winner: events.point,
        rate: returnRate(state, 'rival'),
        hits: state.hits.rival,
        chances: state.chances.rival,
        game: events.game ?? null,
        score: { ...state.score },
        episodes: this.episodes,
      })
      this.episodes = []
    }
    return events
  }

  takeOutcomes(): RallyOutcome[] {
    const list = this.outcomes
    this.outcomes = []
    return list
  }

  get serving(): boolean {
    return this.state.phase === 'serve' && this.state.server === 'player'
  }
}
