import { describe, expect, it } from 'vitest'
import {
  CANVAS_CEILING,
  createEngine,
  type EngineOptions,
  type EngineStats,
  FRAME_WINDOW,
  MAX_PARTICLES,
  median,
  MIN_PARTICLES,
  particleTarget,
  POINTER_RADIUS,
  REDUCTION_FACTOR,
} from '@/lib/motion/engine'
import { type Field, particleAlpha, pointerForce, spawnParticle, stepParticles } from '@/lib/motion/particles'
import { fakeScheduler, fakeSprite, fakeSurface, seededRandom } from './fakes'

function setup(overrides: Partial<EngineOptions> = {}) {
  const surface = fakeSurface()
  const scheduler = fakeScheduler()
  const reports: EngineStats[] = []
  const sprites: string[] = []
  const engine = createEngine({
    surface,
    scheduler,
    createSprite: (color, radius) => {
      sprites.push(color)
      return fakeSprite(color, radius)
    },
    width: 1280,
    height: 800,
    random: seededRandom(),
    onStats: (stats) => reports.push(stats),
    ...overrides,
  })
  return { engine, surface, scheduler, reports, sprites }
}

describe('cantidad de partículas', () => {
  it('escala con el área, con piso y techo', () => {
    expect(particleTarget('full', 1280, 800)).toBe(223)
    expect(particleTarget('subtle', 1280, 800)).toBe(112)
    expect(particleTarget('full', 390, 844)).toBe(120)
    expect(particleTarget('subtle', 390, 844)).toBe(MIN_PARTICLES)
    expect(particleTarget('full', 3840, 2160)).toBe(MAX_PARTICLES)
    expect(particleTarget('subtle', 0, 0)).toBe(MIN_PARTICLES)
  })

  it('calcula la mediana de una ventana de cuadros', () => {
    expect(median([30, 10, 20])).toBe(20)
    expect(median([16, 18, 30, 40])).toBe(24)
    expect(median([])).toBeNaN()
  })
})

describe('ciclo de animación', () => {
  it('arranca con un solo cuadro pedido y dibuja en cada cuadro', () => {
    const { engine, scheduler, surface } = setup({ pixelRatio: 1.5 })
    expect(engine.stats().state).toBe('running')
    expect(surface.width).toBe(1920)
    expect(surface.height).toBe(1200)
    expect(scheduler.pending()).toBe(1)

    scheduler.run(3)
    expect(scheduler.pending()).toBe(1)
    expect(surface.context.clears).toBe(3)
    expect(surface.context.draws).toBeGreaterThan(0)
  })

  it('suma partículas blancas en oscuro y pinta negras en claro, con el verde como acento', () => {
    const dark = setup()
    dark.scheduler.run(2)
    expect(new Set(dark.surface.context.operations)).toEqual(new Set(['lighter']))
    expect(dark.sprites).toEqual(['#ffffff', '#25ed9e'])

    dark.engine.setPalette({ mode: 'light', particle: '#000000', accent: '#25ed9e' })
    dark.surface.context.operations.length = 0
    dark.scheduler.run(2)
    expect(new Set(dark.surface.context.operations)).toEqual(new Set(['source-over']))
    expect(dark.sprites.slice(2)).toEqual(['#000000', '#25ed9e'])
  })

  it('nunca pide más de un cuadro a la vez', () => {
    const { engine, scheduler } = setup()
    engine.resume('hidden')
    engine.setIntensity('full')
    engine.setReducedMotion(false)
    scheduler.run(5)
    expect(scheduler.pending()).toBe(1)
    expect(scheduler.requested).toBe(6)
  })
})

describe('reducción adaptativa', () => {
  it('quita 30 % de partículas si la mediana de 60 cuadros supera 20 ms', () => {
    const { engine, scheduler } = setup({ intensity: 'full' })
    const before = engine.stats().particles
    scheduler.run(FRAME_WINDOW, 25)
    expect(engine.stats().particles).toBe(before)
    scheduler.tick(25)
    expect(engine.stats().particles).toBe(Math.floor(before * REDUCTION_FACTOR))
    expect(engine.stats().medianFrameMs).toBe(25)
  })

  it('no baja de 60 partículas aunque siga lento', () => {
    const { engine, scheduler } = setup({ intensity: 'full' })
    scheduler.run(FRAME_WINDOW * 12, 40)
    expect(engine.stats().particles).toBe(MIN_PARTICLES)
    expect(engine.stats().capacity).toBe(MIN_PARTICLES)
  })

  it('no reduce con cuadros fluidos ni por unos pocos cuadros lentos', () => {
    const { engine, scheduler } = setup({ intensity: 'full' })
    const before = engine.stats().particles
    scheduler.run(FRAME_WINDOW * 3, 1000 / 60)
    for (let i = 0; i < FRAME_WINDOW; i++) scheduler.tick(i % 3 === 0 ? 60 : 16)
    expect(engine.stats().particles).toBe(before)
  })

  it('respeta la capacidad reducida al cambiar de intensidad', () => {
    const { engine, scheduler } = setup({ intensity: 'subtle' })
    scheduler.run(FRAME_WINDOW + 1, 30)
    const reduced = engine.stats().particles
    engine.setIntensity('full')
    expect(engine.stats().particles).toBe(reduced)
  })

  it('no cuenta como cuadro lento el tiempo en pausa', () => {
    const { engine, scheduler } = setup({ intensity: 'full' })
    const before = engine.stats().particles
    for (let i = 0; i < FRAME_WINDOW + 5; i++) {
      scheduler.tick(16)
      engine.pause('hidden')
      scheduler.tick(5000)
      engine.resume('hidden')
    }
    expect(engine.stats().particles).toBe(before)
  })
})

describe('pausa y reanudación', () => {
  it('se pausa con la pestaña oculta y se reanuda al volver', () => {
    const { engine, scheduler, surface } = setup()
    scheduler.run(2)
    engine.pause('hidden')
    expect(engine.stats().state).toBe('paused')
    expect(scheduler.pending()).toBe(0)
    const draws = surface.context.draws
    scheduler.run(10)
    expect(surface.context.draws).toBe(draws)

    engine.resume('hidden')
    expect(engine.stats().state).toBe('running')
    expect(scheduler.pending()).toBe(1)
  })

  it('sigue en pausa mientras quede un motivo (oculta o fuera de pantalla)', () => {
    const { engine, scheduler } = setup()
    engine.pause('hidden')
    engine.pause('offscreen')
    engine.resume('hidden')
    expect(engine.stats().state).toBe('paused')
    expect(scheduler.pending()).toBe(0)
    engine.resume('offscreen')
    expect(engine.stats().state).toBe('running')
  })

  it('libera el cuadro pendiente al destruirse y queda inerte', () => {
    const { engine, scheduler, surface, reports } = setup()
    engine.destroy()
    expect(scheduler.pending()).toBe(0)
    expect(scheduler.cancelled).toBe(1)
    expect(engine.stats()).toMatchObject({ state: 'destroyed', particles: 0 })
    const draws = surface.context.draws
    engine.resume('hidden')
    engine.setIntensity('full')
    engine.setReducedMotion(true)
    engine.setPointer(10, 10)
    scheduler.run(5)
    expect(scheduler.pending()).toBe(0)
    expect(surface.context.draws).toBe(draws)
    expect(reports.at(-1)?.state).toBe('destroyed')
  })
})

describe('movimiento reducido', () => {
  it('dibuja un único cuadro estático y no anima', () => {
    const { engine, scheduler, surface } = setup({ reducedMotion: true })
    expect(engine.stats().state).toBe('static')
    expect(scheduler.pending()).toBe(0)
    expect(surface.context.clears).toBe(1)
    expect(surface.context.draws).toBeGreaterThan(0)
    scheduler.run(10)
    expect(surface.context.clears).toBe(1)
  })

  it('redibuja estático al cambiar de tema o de tamaño y reanuda si se desactiva', () => {
    const { engine, scheduler, surface } = setup({ reducedMotion: true })
    engine.setPalette({ mode: 'light', particle: '#000000', accent: '#25ed9e' })
    engine.resize(800, 600)
    expect(surface.context.clears).toBe(3)
    expect(scheduler.pending()).toBe(0)
    engine.setReducedMotion(false)
    expect(engine.stats().state).toBe('running')
    expect(scheduler.pending()).toBe(1)
  })
})

describe('interacción con puntero y toque', () => {
  const field = (pointer: Field['pointer']): Field => ({ width: 1000, height: 1000, speed: 1, accentShare: 0, pointer })

  it('solo actúa dentro de un radio de 120 px', () => {
    expect(POINTER_RADIUS).toBe(120)
    expect(pointerForce(119, 0)).not.toBeNull()
    expect(pointerForce(120, 0)).toBeNull()
    expect(pointerForce(0, 300)).toBeNull()
  })

  it('repele cerca del centro y atrae suave en el borde del radio', () => {
    expect(pointerForce(20, 0)!.x).toBeGreaterThan(0)
    expect(pointerForce(-20, 0)!.x).toBeLessThan(0)
    expect(pointerForce(100, 0)!.x).toBeLessThan(0)
    expect(Math.abs(pointerForce(100, 0)!.x)).toBeLessThan(pointerForce(20, 0)!.x)
  })

  it('aparta a las partículas cercanas y deja quietas a las lejanas', () => {
    const random = seededRandom(7)
    const near = spawnParticle(field(null), random, true)
    const far = spawnParticle(field(null), random, true)
    Object.assign(near, { x: 530, y: 500, age: 0, life: 100 })
    Object.assign(far, { x: 900, y: 900, age: 0, life: 100 })
    const control = { ...near }
    const farVelocity = { vx: far.vx, vy: far.vy }

    for (let i = 0; i < 20; i++) {
      stepParticles([near, far], 1 / 60, field({ x: 500, y: 500 }), random)
      stepParticles([control], 1 / 60, field(null), random)
    }

    expect(near.x - control.x).toBeGreaterThan(10)
    expect(near.glow).toBeGreaterThan(0)
    expect(far.vx).toBeCloseTo(farVelocity.vx)
    expect(far.vy).toBeCloseTo(farVelocity.vy)
    expect(far.glow).toBe(0)
  })

  it('el motor informa cuándo hay puntero activo sin reportar cada movimiento', () => {
    const { engine, reports } = setup()
    const count = reports.length
    engine.setPointer(10, 10)
    engine.setPointer(20, 20)
    engine.setPointer(30, 30)
    expect(reports.length).toBe(count + 1)
    expect(engine.stats().pointer).toBe(true)
    engine.clearPointer()
    engine.clearPointer()
    expect(reports.length).toBe(count + 2)
    expect(engine.stats().pointer).toBe(false)
  })
})

describe('partículas', () => {
  it('nacen y mueren con un brillo suave, sin parpadeo', () => {
    const particle = spawnParticle({ width: 100, height: 100, speed: 1, accentShare: 0, pointer: null }, seededRandom(3), false)
    expect(particleAlpha(particle, 1)).toBe(0)
    particle.age = particle.life / 2
    expect(particleAlpha(particle, 1)).toBeCloseTo(particle.peak)
    particle.age = particle.life
    expect(particleAlpha(particle, 1)).toBeCloseTo(0)
  })

  it('el techo de opacidad del lienzo es menor en páginas sutiles', () => {
    expect(CANVAS_CEILING.subtle).toBeLessThan(CANVAS_CEILING.full)
    expect(CANVAS_CEILING.full).toBeLessThanOrEqual(0.7)
  })

  it('cambia la cantidad al cambiar la intensidad y al redimensionar', () => {
    const { engine } = setup()
    expect(engine.stats().particles).toBe(particleTarget('subtle', 1280, 800))
    engine.setIntensity('full')
    expect(engine.stats().particles).toBe(particleTarget('full', 1280, 800))
    engine.resize(390, 844)
    expect(engine.stats().particles).toBe(particleTarget('full', 390, 844))
  })
})
