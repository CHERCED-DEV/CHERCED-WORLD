export type Side = 'player' | 'rival'

export const SIDES: readonly Side[] = ['player', 'rival']

export const COURT = { length: 1, width: 0.625 } as const

export const BALL_RADIUS = 0.011

export const PADDLE = { half: 0.068, thickness: 0.016, inset: 0.045 } as const

export const PADDLE_U: Record<Side, number> = { player: PADDLE.inset, rival: COURT.length - PADDLE.inset }

export const PADDLE_SPEED = 0.78

export const SERVE_SPEED = 0.6

export const MAX_SPEED = 1.25

export const SPEEDUP = 1.04

export const MAX_BOUNCE_ANGLE = 0.95

export const SERVE_ANGLE = 0.5

export const PADDLE_SPIN = 0.22

export const STEP = 1 / 60

export const RIVAL_SERVE_DELAY = 0.7

export const PLAYER_AUTO_SERVE = 3

export const POINT_PAUSE = 0.8

export const GAME_POINTS = 7

export type Phase = 'serve' | 'play' | 'point'

export type Ball = { u: number; v: number; du: number; dv: number }

export type Paddle = { v: number; vel: number }

export type RallyState = {
  ball: Ball
  paddles: Record<Side, Paddle>
  phase: Phase
  server: Side
  timer: number
  score: Record<Side, number>
  game: number
  rally: number
  hits: Record<Side, number>
  chances: Record<Side, number>
  winner: Side | null
  seed: number
  time: number
}

export type StepInput = { player: number; rival: number; serve?: boolean }

export type StepEvents = {
  serve?: Side
  hit?: Side
  wall?: boolean
  point?: Side
  game?: Side
  nextServe?: Side
}

export const other = (side: Side): Side => (side === 'player' ? 'rival' : 'player')

export const clamp = (value: number, min: number, max: number): number => (value < min ? min : value > max ? max : value)

export function nextRandom(state: { seed: number }): number {
  state.seed = (state.seed + 0x6d2b79f5) | 0
  let t = state.seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export function createRally(seed = 1, server: Side = 'player'): RallyState {
  const center = COURT.width / 2
  const state: RallyState = {
    ball: { u: 0, v: center, du: 0, dv: 0 },
    paddles: { player: { v: center, vel: 0 }, rival: { v: center, vel: 0 } },
    phase: 'serve',
    server,
    timer: server === 'player' ? PLAYER_AUTO_SERVE : RIVAL_SERVE_DELAY,
    score: { player: 0, rival: 0 },
    game: 1,
    rally: 0,
    hits: { player: 0, rival: 0 },
    chances: { player: 0, rival: 0 },
    winner: null,
    seed: seed | 0,
    time: 0,
  }
  holdBall(state)
  return state
}

export function contactU(side: Side): number {
  return side === 'player' ? PADDLE_U.player + BALL_RADIUS : PADDLE_U.rival - BALL_RADIUS
}

export function heading(ball: Ball): Side | null {
  if (ball.du > 0) return 'rival'
  if (ball.du < 0) return 'player'
  return null
}

export function foldV(raw: number): number {
  const span = COURT.width - 2 * BALL_RADIUS
  const shifted = raw - BALL_RADIUS
  const period = 2 * span
  const m = ((shifted % period) + period) % period
  return (m <= span ? m : period - m) + BALL_RADIUS
}

export function forecastV(ball: Ball, side: Side): number | null {
  if (heading(ball) !== side) return null
  const time = (contactU(side) - ball.u) / ball.du
  if (time < 0) return foldV(ball.v)
  return foldV(ball.v + ball.dv * time)
}

function holdBall(state: RallyState): void {
  const { ball } = state
  ball.u = contactU(state.server)
  ball.v = state.paddles[state.server].v
  ball.du = 0
  ball.dv = 0
}

function movePaddle(paddle: Paddle, intent: number, dt: number): void {
  paddle.vel = clamp(Number.isFinite(intent) ? intent : 0, -1, 1) * PADDLE_SPEED
  paddle.v = clamp(paddle.v + paddle.vel * dt, PADDLE.half, COURT.width - PADDLE.half)
}

function launch(state: RallyState, events: StepEvents): void {
  const angle = (nextRandom(state) * 2 - 1) * SERVE_ANGLE
  const direction = state.server === 'player' ? 1 : -1
  state.ball.du = direction * SERVE_SPEED * Math.cos(angle)
  state.ball.dv = SERVE_SPEED * Math.sin(angle)
  state.phase = 'play'
  state.rally += 1
  state.hits = { player: 0, rival: 0 }
  state.chances = { player: 0, rival: 0 }
  state.chances[other(state.server)] += 1
  state.winner = null
  events.serve = state.server
}

function bounce(state: RallyState, side: Side, contactV: number): void {
  const { ball } = state
  const paddle = state.paddles[side]
  const offset = clamp((contactV - paddle.v) / (PADDLE.half + BALL_RADIUS), -1, 1)
  const spin = (paddle.vel / PADDLE_SPEED) * PADDLE_SPIN
  const angle = clamp(offset * MAX_BOUNCE_ANGLE + spin, -MAX_BOUNCE_ANGLE, MAX_BOUNCE_ANGLE)
  const speed = Math.min(Math.hypot(ball.du, ball.dv) * SPEEDUP, MAX_SPEED)
  const direction = side === 'player' ? 1 : -1
  ball.u = contactU(side)
  ball.v = contactV
  ball.du = direction * speed * Math.cos(angle)
  ball.dv = speed * Math.sin(angle)
}

function score(state: RallyState, winner: Side, events: StepEvents): void {
  state.phase = 'point'
  state.timer = POINT_PAUSE
  state.winner = winner
  state.score[winner] += 1
  events.point = winner
  if (state.score[winner] >= GAME_POINTS) events.game = winner
}

function nextServe(state: RallyState, events: StepEvents): void {
  if (state.score.player >= GAME_POINTS || state.score.rival >= GAME_POINTS) {
    state.score = { player: 0, rival: 0 }
    state.game += 1
  }
  state.server = other(state.server)
  state.phase = 'serve'
  state.timer = state.server === 'player' ? PLAYER_AUTO_SERVE : RIVAL_SERVE_DELAY
  holdBall(state)
  events.nextServe = state.server
}

function fly(state: RallyState, dt: number, events: StepEvents): void {
  const { ball } = state
  const target = heading(ball)
  const prevU = ball.u
  const prevV = ball.v
  const travelV = ball.dv * dt
  ball.u += ball.du * dt
  ball.v += travelV

  if (ball.v < BALL_RADIUS) {
    ball.v = 2 * BALL_RADIUS - ball.v
    ball.dv = Math.abs(ball.dv)
    events.wall = true
  } else if (ball.v > COURT.width - BALL_RADIUS) {
    ball.v = 2 * (COURT.width - BALL_RADIUS) - ball.v
    ball.dv = -Math.abs(ball.dv)
    events.wall = true
  }

  if (!target) return
  const line = contactU(target)
  const crossed = target === 'rival' ? prevU < line && ball.u >= line : prevU > line && ball.u <= line
  if (crossed) {
    const fraction = (line - prevU) / (ball.u - prevU)
    const contactV = foldV(prevV + travelV * fraction)
    const paddle = state.paddles[target]
    if (Math.abs(contactV - paddle.v) <= PADDLE.half + BALL_RADIUS) {
      bounce(state, target, contactV)
      state.hits[target] += 1
      state.chances[other(target)] += 1
      events.hit = target
      return
    }
  }
  if (ball.u < -BALL_RADIUS * 2) score(state, 'rival', events)
  else if (ball.u > COURT.length + BALL_RADIUS * 2) score(state, 'player', events)
}

export function step(state: RallyState, input: StepInput, dt: number = STEP): StepEvents {
  const events: StepEvents = {}
  state.time += dt
  movePaddle(state.paddles.player, input.player, dt)
  movePaddle(state.paddles.rival, input.rival, dt)

  if (state.phase === 'serve') {
    holdBall(state)
    state.timer -= dt
    const wants = state.server === 'player' ? Boolean(input.serve) : false
    if (wants || state.timer <= 0) launch(state, events)
    return events
  }

  if (state.phase === 'point') {
    state.ball.u += state.ball.du * dt
    state.ball.v = clamp(state.ball.v + state.ball.dv * dt, BALL_RADIUS, COURT.width - BALL_RADIUS)
    state.timer -= dt
    if (state.timer <= 0) nextServe(state, events)
    return events
  }

  fly(state, dt, events)
  return events
}

export function returnRate(state: Pick<RallyState, 'hits' | 'chances'>, side: Side): number | null {
  const chances = state.chances[side]
  if (chances <= 0) return null
  return Math.min(1, state.hits[side] / chances)
}
