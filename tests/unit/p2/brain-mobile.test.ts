import { describe, expect, it } from 'vitest'
import {
  BAR_CELLS,
  brainData,
  COMPACT_CORE,
  COMPACT_CORE_RADIUS,
  COMPACT_LOBE_RADIUS,
  COMPACT_QUERY,
  COMPACT_VIEW,
  compactGeometry,
  compactLobePoint,
  lobePoint,
  neuronGeometry,
  stepLobe,
} from '@/components/site/about/brain'
import { RAIN_COMPACT, RAIN_DESKTOP, RAIN_FPS, RAIN_FRAME_MS, rainColumns, rainParams, shouldDraw } from '@/components/site/about/rain'
import { getProjects, getSite } from '@/lib/content'

const { about } = getSite()
const data = brainData(about, getProjects(), 'es', 'Actualidad')
const total = data.lobes.length
const geometries = data.lobes.map((lobe, index) => compactGeometry(index, lobe.skills.map((skill) => skill.level), total))
const MAP_AT_375 = 343

describe('mapa compacto: disposición cuadrada 1:1 (T820, FR-620, R-605)', () => {
  it('es un cuadrado con el núcleo al centro y la misma media que el resto del sitio', () => {
    expect(COMPACT_VIEW.width).toBe(COMPACT_VIEW.height)
    expect(COMPACT_CORE).toEqual({ x: COMPACT_VIEW.width / 2, y: COMPACT_VIEW.height / 2 })
    expect(COMPACT_QUERY).toBe('(max-width: 767.98px)')
  })

  it('los seis lóbulos de T229 van en círculo, en el mismo orden angular que en escritorio', () => {
    expect(total).toBe(6)
    const radii = data.lobes.map((_, index) => {
      const point = compactLobePoint(index, total)
      return Math.hypot(point.x - COMPACT_CORE.x, point.y - COMPACT_CORE.y)
    })
    for (const radius of radii) expect(radius).toBeCloseTo(radii[0]!, 0)
    const angles = [-150, -90, -30, 30, 90, 150]
    for (let index = 0; index < total; index++) {
      const near = compactLobePoint(index, total)
      const wide = lobePoint(index, total)
      expect((Math.atan2(near.y - COMPACT_CORE.y, near.x - COMPACT_CORE.x) * 180) / Math.PI).toBeCloseTo(angles[index]!, 0)
      expect(Math.sign(Math.round(near.x - COMPACT_CORE.x))).toBe(Math.sign(Math.round(wide.x - 400)))
      expect(Math.sign(Math.round(near.y - COMPACT_CORE.y))).toBe(Math.sign(Math.round(wide.y - 300)))
    }
  })

  it('a 375 px cada lóbulo mide 64 px o más y ninguno toca a otro ni al núcleo', () => {
    const scale = MAP_AT_375 / COMPACT_VIEW.width
    expect(Math.max(64, 0.22 * MAP_AT_375)).toBeGreaterThanOrEqual(64)
    expect(COMPACT_LOBE_RADIUS * 2 * scale).toBeGreaterThanOrEqual(64)
    for (let a = 0; a < total; a++) {
      const pa = compactLobePoint(a, total)
      expect(Math.hypot(pa.x - COMPACT_CORE.x, pa.y - COMPACT_CORE.y) - COMPACT_LOBE_RADIUS).toBeGreaterThan(COMPACT_CORE_RADIUS + 12)
      for (let b = a + 1; b < total; b++) {
        const pb = compactLobePoint(b, total)
        expect(Math.hypot(pa.x - pb.x, pa.y - pb.y), `${a}-${b}`).toBeGreaterThan(COMPACT_LOBE_RADIUS * 2 + 24)
      }
    }
  })

  it('lóbulos, neuronas y conexiones quedan dentro del cuadrado', () => {
    for (const geometry of geometries) {
      const { lobe } = geometry
      expect(lobe.x - COMPACT_LOBE_RADIUS).toBeGreaterThanOrEqual(0)
      expect(lobe.y - COMPACT_LOBE_RADIUS).toBeGreaterThanOrEqual(0)
      expect(lobe.x + COMPACT_LOBE_RADIUS).toBeLessThanOrEqual(COMPACT_VIEW.width)
      expect(lobe.y + COMPACT_LOBE_RADIUS).toBeLessThanOrEqual(COMPACT_VIEW.height)
      for (const neuron of geometry.neurons) {
        expect(neuron.x - neuron.r).toBeGreaterThan(0)
        expect(neuron.y - neuron.r).toBeGreaterThan(0)
        expect(neuron.x + neuron.r).toBeLessThan(COMPACT_VIEW.width)
        expect(neuron.y + neuron.r).toBeLessThan(COMPACT_VIEW.height)
      }
    }
  })

  it('una neurona por skill, fuera de su lóbulo y lejos de los demás lóbulos', () => {
    data.lobes.forEach((lobe, index) => {
      const geometry = geometries[index]!
      expect(geometry.neurons).toHaveLength(lobe.skills.length)
      for (const neuron of geometry.neurons) {
        expect(Math.hypot(neuron.x - geometry.lobe.x, neuron.y - geometry.lobe.y)).toBeGreaterThan(COMPACT_LOBE_RADIUS)
        geometries.forEach((other, otherIndex) => {
          if (otherIndex === index) return
          expect(Math.hypot(neuron.x - other.lobe.x, neuron.y - other.lobe.y), `${lobe.id} → ${data.lobes[otherIndex]!.id}`).toBeGreaterThan(COMPACT_LOBE_RADIUS + 6)
        })
      }
    })
  })

  it('las neuronas no se pisan entre sí y crecen con el nivel', () => {
    const all = geometries.flatMap((geometry) => geometry.neurons)
    for (let a = 0; a < all.length; a++) {
      for (let b = a + 1; b < all.length; b++) {
        expect(Math.hypot(all[a]!.x - all[b]!.x, all[a]!.y - all[b]!.y)).toBeGreaterThan(all[a]!.r + all[b]!.r)
      }
    }
    const small = compactGeometry(0, [40, 100])
    expect(small.neurons[1]!.r).toBeGreaterThan(small.neurons[0]!.r)
  })

  it('cada sinapsis va del borde del núcleo al borde de su lóbulo', () => {
    geometries.forEach((geometry) => {
      const { x1, y1, x2, y2 } = geometry.synapse
      expect(Math.hypot(x1 - COMPACT_CORE.x, y1 - COMPACT_CORE.y)).toBeGreaterThan(COMPACT_CORE_RADIUS)
      expect(Math.hypot(x2 - geometry.lobe.x, y2 - geometry.lobe.y)).toBeGreaterThan(COMPACT_LOBE_RADIUS)
      expect(Math.hypot(x2 - x1, y2 - y1)).toBeGreaterThan(20)
    })
  })

  it('el escritorio no cambia: la geometría ancha sigue igual', () => {
    expect(lobePoint(0)).toEqual({ x: 167.9, y: 212 })
    expect(neuronGeometry(0, [60, 92]).neurons.map((neuron) => neuron.r)).toEqual([4, 5.1])
    expect(BAR_CELLS).toBe(20)
  })
})

describe('hoja del lóbulo: anterior y siguiente (T822, FR-622)', () => {
  const ids = data.lobes.map((lobe) => lobe.id)

  it('recorre los seis en círculo hacia los dos lados', () => {
    expect(stepLobe(ids, 'frontend', 'next')).toBe('architecture')
    expect(stepLobe(ids, 'frontend', 'prev')).toBe('business')
    expect(stepLobe(ids, 'business', 'next')).toBe('frontend')
    let id = 'frontend'
    for (let i = 0; i < ids.length; i++) id = stepLobe(ids, id, 'next')
    expect(id).toBe('frontend')
  })

  it('con un id desconocido o sin lóbulos no se rompe', () => {
    expect(stepLobe(ids, 'craft', 'next')).toBe('architecture')
    expect(stepLobe([], 'frontend', 'next')).toBe('frontend')
  })
})

describe('lluvia móvil (T823, FR-623, R-606)', () => {
  it('en móvil, 12 fps o menos y la mitad de columnas o menos', () => {
    expect(RAIN_COMPACT.fps).toBeLessThanOrEqual(12)
    expect(RAIN_COMPACT.frameMs).toBeCloseTo(1000 / RAIN_COMPACT.fps)
    for (const width of [288, 343, 358, 380, 735]) {
      expect(rainColumns(width, RAIN_COMPACT)).toBeLessThanOrEqual(Math.ceil(rainColumns(width, RAIN_DESKTOP) / 2))
    }
    expect(rainParams(true)).toBe(RAIN_COMPACT)
  })

  it('en escritorio no cambia: 20 fps y una columna cada 16 px', () => {
    expect(rainParams(false)).toBe(RAIN_DESKTOP)
    expect(RAIN_DESKTOP).toEqual({ fps: RAIN_FPS, frameMs: RAIN_FRAME_MS, step: 16 })
    expect(rainColumns(800, RAIN_DESKTOP)).toBe(50)
  })

  it('el ritmo de dibujo respeta los fps de cada modo', () => {
    expect(shouldDraw(1000, 1000 - RAIN_FRAME_MS)).toBe(true)
    expect(shouldDraw(1000, 1000 - RAIN_FRAME_MS, RAIN_COMPACT.frameMs)).toBe(false)
    expect(shouldDraw(1000, 1000 - RAIN_COMPACT.frameMs, RAIN_COMPACT.frameMs)).toBe(true)
  })
})
