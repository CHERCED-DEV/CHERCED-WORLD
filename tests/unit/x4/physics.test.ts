import { describe, expect, it } from 'vitest'
import {
  BALL_RADIUS,
  COURT,
  GAME_POINTS,
  MAX_BOUNCE_ANGLE,
  MAX_SPEED,
  PADDLE,
  PADDLE_SPEED,
  PLAYER_AUTO_SERVE,
  POINT_PAUSE,
  RIVAL_SERVE_DELAY,
  SERVE_SPEED,
  SPEEDUP,
  STEP,
  contactU,
  createRally,
  foldV,
  forecastV,
  returnRate,
  step,
  type RallyState,
  type StepEvents,
  type StepInput,
} from '@/lib/ailab/games/physics'

const IDLE: StepInput = { player: 0, rival: 0 }

function run(state: RallyState, ticks: number, input: StepInput | ((state: RallyState) => StepInput) = IDLE): StepEvents[] {
  const events: StepEvents[] = []
  for (let i = 0; i < ticks; i += 1) events.push(step(state, typeof input === 'function' ? input(state) : input))
  return events
}

function until(state: RallyState, done: (events: StepEvents) => boolean, input: StepInput | ((state: RallyState) => StepInput) = IDLE, limit = 2000): StepEvents {
  for (let i = 0; i < limit; i += 1) {
    const events = step(state, typeof input === 'function' ? input(state) : input)
    if (done(events)) return events
  }
  throw new Error('no ocurrió')
}

function flying(u: number, v: number, du: number, dv: number, seed = 1): RallyState {
  const state = createRally(seed)
  state.phase = 'play'
  Object.assign(state.ball, { u, v, du, dv })
  return state
}

describe('física del peloteo (T750)', () => {
  it('arranca en saque: la bola espera en la paleta de quien saca', () => {
    const state = createRally(3, 'player')
    expect(state.phase).toBe('serve')
    expect(state.ball.u).toBeCloseTo(contactU('player'))
    expect(state.ball.v).toBeCloseTo(state.paddles.player.v)
    run(state, 10, { player: 1, rival: 0 })
    expect(state.phase).toBe('serve')
    expect(state.ball.v).toBeCloseTo(state.paddles.player.v)
  })

  it('el jugador saca cuando lo pide, o solo a los 3 segundos', () => {
    const asked = createRally(3, 'player')
    const events = step(asked, { player: 0, rival: 0, serve: true })
    expect(events.serve).toBe('player')
    expect(asked.phase).toBe('play')
    expect(asked.ball.du).toBeGreaterThan(0)
    expect(Math.hypot(asked.ball.du, asked.ball.dv)).toBeCloseTo(SERVE_SPEED)
    expect(asked.rally).toBe(1)
    expect(asked.chances).toEqual({ player: 0, rival: 1 })

    const waiting = createRally(3, 'player')
    const ticks = Math.round(PLAYER_AUTO_SERVE / STEP)
    expect(run(waiting, ticks - 2).some((e) => e.serve)).toBe(false)
    expect(run(waiting, 4).some((e) => e.serve === 'player')).toBe(true)
  })

  it('la IA saca sola, hacia el jugador', () => {
    const state = createRally(3, 'rival')
    const events = until(state, (e) => Boolean(e.serve))
    expect(events.serve).toBe('rival')
    expect(state.time).toBeCloseTo(RIVAL_SERVE_DELAY, 1)
    expect(state.ball.du).toBeLessThan(0)
    expect(state.chances.player).toBe(1)
  })

  it('es determinista: misma semilla y mismas entradas, misma partida', () => {
    const script = (state: RallyState): StepInput => ({ player: Math.sin(state.time * 3), rival: Math.cos(state.time * 2), serve: state.time > 0.3 })
    const a = createRally(42)
    const b = createRally(42)
    run(a, 1500, script)
    run(b, 1500, script)
    expect(a).toEqual(b)
    const c = createRally(43)
    run(c, 1500, script)
    expect(c.ball).not.toEqual(a.ball)
  })

  it('rebota en los rieles de cristal sin perder velocidad', () => {
    const state = flying(0.5, BALL_RADIUS + 0.002, 0.3, -0.6)
    const events = step(state, IDLE)
    expect(events.wall).toBe(true)
    expect(state.ball.dv).toBeGreaterThan(0)
    expect(state.ball.v).toBeGreaterThanOrEqual(BALL_RADIUS)
    const bottom = flying(0.5, COURT.width - BALL_RADIUS - 0.002, 0.3, 0.6)
    expect(step(bottom, IDLE).wall).toBe(true)
    expect(bottom.ball.dv).toBeLessThan(0)
    expect(Math.hypot(bottom.ball.du, bottom.ball.dv)).toBeCloseTo(Math.hypot(0.3, 0.6))
  })

  it('la paleta devuelve, acelera la bola y el ángulo depende de dónde pega', () => {
    const center = flying(0.8, 0.3, 0.8, 0)
    center.paddles.rival.v = 0.3
    const events = until(center, (e) => Boolean(e.hit))
    expect(events.hit).toBe('rival')
    expect(center.ball.du).toBeLessThan(0)
    expect(Math.abs(center.ball.dv)).toBeLessThan(0.01)
    expect(Math.hypot(center.ball.du, center.ball.dv)).toBeCloseTo(0.8 * SPEEDUP)
    expect(center.hits.rival).toBe(1)
    expect(center.chances.player).toBe(1)

    const edge = flying(0.8, 0.3 + PADDLE.half * 0.9, 0.8, 0)
    edge.paddles.rival.v = 0.3
    until(edge, (e) => Boolean(e.hit))
    const angle = Math.atan2(Math.abs(edge.ball.dv), Math.abs(edge.ball.du))
    expect(edge.ball.dv).toBeGreaterThan(0)
    expect(angle).toBeGreaterThan(MAX_BOUNCE_ANGLE * 0.7)
    expect(angle).toBeLessThanOrEqual(MAX_BOUNCE_ANGLE + 1e-6)
  })

  it('a la velocidad máxima no atraviesa la paleta', () => {
    const state = flying(0.5, 0.31, MAX_SPEED, 0)
    state.paddles.rival.v = 0.31
    expect(until(state, (e) => Boolean(e.hit || e.point)).hit).toBe('rival')
    expect(Math.hypot(state.ball.du, state.ball.dv)).toBeLessThanOrEqual(MAX_SPEED + 1e-9)
  })

  it('si la paleta no llega es punto, y el siguiente saque cambia de lado', () => {
    const state = flying(0.7, 0.1, 0.8, 0)
    state.paddles.rival.v = COURT.width - PADDLE.half
    state.server = 'player'
    const events = until(state, (e) => Boolean(e.point))
    expect(events.point).toBe('player')
    expect(state.score).toEqual({ player: 1, rival: 0 })
    expect(state.phase).toBe('point')
    expect(returnRate({ hits: { player: 0, rival: 0 }, chances: { player: 0, rival: 1 } }, 'rival')).toBe(0)
    const next = until(state, (e) => Boolean(e.nextServe))
    expect(next.nextServe).toBe('rival')
    expect(state.time).toBeGreaterThan(POINT_PAUSE)
    expect(state.phase).toBe('serve')
  })

  it('la partida termina a 7 y la siguiente empieza en cero', () => {
    const state = flying(0.7, 0.1, 0.8, 0)
    state.paddles.rival.v = COURT.width - PADDLE.half
    state.score = { player: GAME_POINTS - 1, rival: 3 }
    expect(until(state, (e) => Boolean(e.point)).game).toBe('player')
    expect(state.score.player).toBe(GAME_POINTS)
    until(state, (e) => Boolean(e.nextServe))
    expect(state.score).toEqual({ player: 0, rival: 0 })
    expect(state.game).toBe(2)
  })

  it('las paletas tienen tope de velocidad y no salen de la mesa', () => {
    const state = createRally(1)
    const before = state.paddles.player.v
    step(state, { player: 5, rival: -5 })
    expect(state.paddles.player.v - before).toBeCloseTo(PADDLE_SPEED * STEP)
    run(state, 400, { player: 1, rival: -1 })
    expect(state.paddles.player.v).toBeCloseTo(COURT.width - PADDLE.half)
    expect(state.paddles.rival.v).toBeCloseTo(PADDLE.half)
    step(state, { player: Number.NaN, rival: 0 })
    expect(state.paddles.player.vel).toBe(0)
  })

  it('el pronóstico de llegada coincide con donde de verdad cruza la bola, con rebotes', () => {
    for (const [v, dv] of [
      [0.1, 0.9],
      [0.5, -1.1],
      [0.3, 0.05],
    ] as const) {
      const state = flying(0.2, v, 0.6, dv)
      const arrival = forecastV(state.ball, 'rival')!
      expect(forecastV(state.ball, 'player')).toBeNull()
      state.paddles.rival.v = Math.min(Math.max(arrival, PADDLE.half), COURT.width - PADDLE.half)
      const events = until(state, (e) => Boolean(e.hit || e.point))
      expect(events.hit, `v=${v} dv=${dv}`).toBe('rival')
      expect(state.ball.v).toBeCloseTo(arrival, 3)
    }
    expect(foldV(-0.05)).toBeCloseTo(2 * BALL_RADIUS + 0.05)
    expect(foldV(COURT.width + 0.05)).toBeCloseTo(COURT.width - 2 * BALL_RADIUS - 0.05)
  })
})
