import { BALL_RADIUS, COURT, MAX_SPEED, PADDLE, PADDLE_SPEED, STEP, clamp, contactU, forecastV, heading, type RallyState, type Side } from './physics'

export const SENSES = 6

export const ACTIONS = 3

export type Action = 0 | 1 | 2

export const ACTION_UP: Action = 0

export const ACTION_STAY: Action = 1

export const ACTION_DOWN: Action = 2

export const DECIDE_EVERY = 2

export const DECISION_DT = STEP * DECIDE_EVERY

const HALF_WIDTH = COURT.width / 2

const TRAVEL = HALF_WIDTH - PADDLE.half

export function intentOf(action: number): number {
  return action - 1
}

export function senses(state: RallyState, side: Side, out: Float32Array = new Float32Array(SENSES)): Float32Array {
  const { ball } = state
  const paddle = state.paddles[side].v
  const approaching = state.phase === 'play' && heading(ball) === side
  const arrival = approaching ? forecastV(ball, side) : null
  out[0] = ((ball.v - paddle) / COURT.width) * 2
  out[1] = arrival === null ? 0 : ((arrival - paddle) / COURT.width) * 2
  out[2] = approaching ? 1 : -1
  out[3] = Math.abs(contactU(side) - ball.u) / COURT.length
  out[4] = ball.dv / MAX_SPEED
  out[5] = clamp((paddle - HALF_WIDTH) / TRAVEL, -1, 1)
  return out
}

export function potential(state: RallyState, side: Side): number {
  const paddle = state.paddles[side].v
  const approaching = state.phase === 'play' && heading(state.ball) === side
  if (approaching) {
    const arrival = forecastV(state.ball, side) ?? state.ball.v
    return -Math.abs(arrival - paddle) / HALF_WIDTH
  }
  return (-0.4 * Math.abs(HALF_WIDTH - paddle)) / HALF_WIDTH
}

export function actionFromMove(delta: number, dt: number = DECISION_DT): Action {
  const threshold = PADDLE_SPEED * dt * 0.25
  if (delta < -threshold) return ACTION_UP
  if (delta > threshold) return ACTION_DOWN
  return ACTION_STAY
}

export type Coach = {
  skill: number
  aim: number
  plan: number | null
  wait: number
  heading: Side | null
}

export function createCoach(skill = 0.85): Coach {
  return { skill, aim: 0, plan: null, wait: 0, heading: null }
}

export function coachIntent(state: RallyState, side: Side, coach: Coach, random: () => number): number {
  const paddle = state.paddles[side].v
  const toward = state.phase === 'play' && heading(state.ball) === side
  const current = state.phase === 'play' ? heading(state.ball) : null
  if (current !== coach.heading) {
    coach.heading = current
    coach.plan = null
    coach.wait = Math.round((1 - coach.skill) * 18 * random())
    coach.aim = (random() * 2 - 1) * PADDLE.half * 0.75
  }
  if (coach.wait > 0) {
    coach.wait -= 1
    return 0
  }
  let target: number
  if (toward) {
    if (coach.plan === null || random() < 0.08) {
      const arrival = forecastV(state.ball, side) ?? state.ball.v
      const miss = (1 - coach.skill) * (random() * 2 - 1) * PADDLE.half * 3.2
      coach.plan = arrival + coach.aim + miss
    }
    target = coach.plan
  } else if (state.phase === 'serve' && state.server === side) {
    target = HALF_WIDTH + coach.aim
  } else {
    target = HALF_WIDTH
  }
  const gap = target - paddle
  const reach = PADDLE_SPEED * STEP
  const pace = 0.55 + 0.45 * coach.skill
  return clamp(gap / reach, -1, 1) * pace
}

export function towardTarget(paddle: number, target: number): number {
  const reach = PADDLE_SPEED * STEP
  const gap = target - paddle
  if (Math.abs(gap) < BALL_RADIUS * 0.1) return 0
  return clamp(gap / reach, -1, 1)
}
