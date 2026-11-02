export const POINTER_RADIUS = 120

const RETURN_RATE = 1.8
const POINTER_STRENGTH = 2600
const SWIRL = 0.35
const NEUTRAL_RING = 0.45
const GLOW_RISE = 4
const GLOW_FALL = 1.5

export type Point = { x: number; y: number }

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  driftX: number
  driftY: number
  r: number
  age: number
  life: number
  peak: number
  accent: boolean
  glow: number
}

export type Field = {
  width: number
  height: number
  speed: number
  accentShare: number
  pointer: Point | null
}

export function spawnParticle(field: Field, random: () => number, initial: boolean, target?: Particle): Particle {
  const particle = target ?? ({} as Particle)
  const life = 2.5 + random() * 4.5
  particle.x = (field.width * (random() + random())) / 2
  particle.y = random() * field.height
  particle.driftX = (6 + random() * 18) * field.speed
  particle.driftY = -(8 + random() * 22) * field.speed
  particle.vx = particle.driftX
  particle.vy = particle.driftY
  particle.r = 10 + random() * 15
  particle.life = life
  particle.age = initial ? random() * life : 0
  particle.peak = 0.15 + 0.85 * random() ** 3
  particle.accent = random() < field.accentShare
  particle.glow = 0
  return particle
}

export function pointerForce(dx: number, dy: number): Point | null {
  const distanceSq = dx * dx + dy * dy
  if (distanceSq >= POINTER_RADIUS * POINTER_RADIUS || distanceSq < 1e-6) return null
  const distance = Math.sqrt(distanceSq)
  const u = distance / POINTER_RADIUS
  const radial = POINTER_STRENGTH * (1 - u) * (NEUTRAL_RING - u)
  const tangential = POINTER_STRENGTH * SWIRL * (1 - u) * (1 - u) * 0.25
  const nx = dx / distance
  const ny = dy / distance
  return { x: nx * radial - ny * tangential, y: ny * radial + nx * tangential }
}

export function stepParticles(list: Particle[], dt: number, field: Field, random: () => number): void {
  const pointer = field.pointer
  for (const particle of list) {
    particle.age += dt
    if (particle.age >= particle.life) {
      spawnParticle(field, random, false, particle)
      continue
    }

    let ax = (particle.driftX - particle.vx) * RETURN_RATE
    let ay = (particle.driftY - particle.vy) * RETURN_RATE
    const force = pointer ? pointerForce(particle.x - pointer.x, particle.y - pointer.y) : null
    if (force) {
      ax += force.x
      ay += force.y
      particle.glow = Math.min(1, particle.glow + dt * GLOW_RISE)
    } else if (particle.glow > 0) {
      particle.glow = Math.max(0, particle.glow - dt * GLOW_FALL)
    }

    particle.vx += ax * dt
    particle.vy += ay * dt
    particle.x += particle.vx * dt
    particle.y += particle.vy * dt

    const margin = particle.r
    if (particle.x > field.width + margin) particle.x = -margin
    else if (particle.x < -margin) particle.x = field.width + margin
    if (particle.y < -margin) particle.y = field.height + margin
    else if (particle.y > field.height + margin) particle.y = -margin
  }
}

export function particleAlpha(particle: Particle, scale: number): number {
  const envelope = Math.sin((Math.PI * Math.min(particle.age, particle.life)) / particle.life)
  return Math.min(1, particle.peak * envelope * scale * (1 + 0.6 * particle.glow))
}
