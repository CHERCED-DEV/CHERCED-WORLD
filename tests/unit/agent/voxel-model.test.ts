import { describe, expect, it } from 'vitest'
import { EMPTY } from '@/components/fun/sprite'
import { AVATAR_BODY, AVATAR_COLORS, GLASSES_DOWN, MOUTH_NAMES, MOUTHS, SWEAT } from '@/components/ailab/agent/avatar-sprite'
import { buildVoxelModel, isHeadPart, pixelsOf, VOXEL_COLORS, VOXEL_DEPTH, VOXEL_MODEL, voxelCount } from '@/components/ailab/agent/voxel-model'

function filled(rows: readonly string[]): number {
  return rows.reduce((total, row) => total + [...row].filter((cell) => cell !== EMPTY).length, 0)
}

const key = ({ x, y, c }: { x: number; y: number; c: string }) => `${x}:${y}:${c}`

describe('Mini Cherced en vóxeles (FR-3701)', () => {
  it('tiene un vóxel por cada píxel lleno del sprite, en su sitio y con su color', () => {
    expect(VOXEL_MODEL.body).toHaveLength(filled(AVATAR_BODY.rows))
    expect(new Set(VOXEL_MODEL.body.map(key))).toEqual(new Set(pixelsOf(AVATAR_BODY).map(key)))
  })

  it('cada cuadro de la boca y la gota de sudor salen del mismo sprite, uno a uno', () => {
    for (const name of MOUTH_NAMES) expect(VOXEL_MODEL.mouths[name].map(key)).toEqual(pixelsOf(MOUTHS[name]).map(key))
    expect(VOXEL_MODEL.sweat).toHaveLength(filled(SWEAT.rows))
  })

  it('al bajar el visor aparecen los ojos del sprite y el visor baja lo mismo que en 2D', () => {
    const eyes = pixelsOf(GLASSES_DOWN).filter((pixel) => pixel.y < 14)
    expect(VOXEL_MODEL.visorDrop).toBe(3)
    expect(VOXEL_MODEL.eyes.map(key)).toEqual(eyes.map(key))
    expect(VOXEL_MODEL.eyes.some((item) => item.c === 'w')).toBe(true)
  })

  it('separa las partes con su propia profundidad: cabeza más gruesa, visor salido y audífonos a los lados', () => {
    const parts = new Set(VOXEL_MODEL.body.map((item) => item.part))
    expect(parts).toEqual(new Set(['hair', 'head', 'visor', 'earcup', 'boom', 'neck', 'torso', 'arms', 'badge', 'legs', 'feet']))
    expect(VOXEL_DEPTH.head.depth).toBeGreaterThan(VOXEL_DEPTH.torso.depth)
    const front = (part: keyof typeof VOXEL_DEPTH) => VOXEL_DEPTH[part].z + VOXEL_DEPTH[part].depth / 2
    expect(front('visor')).toBeGreaterThan(front('head'))
    const visor = VOXEL_MODEL.body.filter((item) => item.part === 'visor')
    expect(visor.some((item) => item.c === 'g')).toBe(true)
    expect(visor.every((item) => item.y >= 11 && item.y <= 15)).toBe(true)
    expect(VOXEL_MODEL.body.filter((item) => item.part === 'earcup').every((item) => item.x < 3)).toBe(true)
  })

  it('ordena el cuerpo para animar la cabeza y el visor como instancias aparte', () => {
    const { body, headStart, visorStart } = VOXEL_MODEL
    expect(body.slice(0, headStart).every((item) => !isHeadPart(item.part))).toBe(true)
    expect(body.slice(headStart, visorStart).every((item) => isHeadPart(item.part) && item.part !== 'visor')).toBe(true)
    expect(body.slice(visorStart).every((item) => item.part === 'visor')).toBe(true)
    expect(voxelCount(VOXEL_MODEL)).toBe(body.length + MOUTH_NAMES.reduce((total, name) => total + VOXEL_MODEL.mouths[name].length, 0) + VOXEL_MODEL.eyes.length + VOXEL_MODEL.sweat.length)
  })

  it('cada color del sprite tiene su color 3D y el modelo se reconstruye igual', () => {
    for (const color of AVATAR_COLORS) expect(VOXEL_COLORS[color]).toBeTypeOf('number')
    expect(buildVoxelModel()).toEqual(VOXEL_MODEL)
  })
})
