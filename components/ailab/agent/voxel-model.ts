import { EMPTY, type Grid } from '@/components/fun/sprite'
import { AVATAR_BODY, GLASSES_DOWN, MOUTH_NAMES, MOUTHS, SWEAT, type MouthName } from './avatar-sprite'

export type VoxelPart = 'hair' | 'head' | 'visor' | 'earcup' | 'boom' | 'neck' | 'torso' | 'arms' | 'badge' | 'legs' | 'shins' | 'feet' | 'overlay' | 'sweat'

export type Voxel = { x: number; y: number; c: string; part: VoxelPart; z: number; depth: number }

export type VoxelModel = {
  width: number
  height: number
  body: Voxel[]
  headStart: number
  visorStart: number
  mouths: Record<MouthName, Voxel[]>
  eyes: Voxel[]
  sweat: Voxel[]
  visorDrop: number
  pivot: { x: number; y: number }
}

export const VOXEL_DEPTH: Record<VoxelPart, { depth: number; z: number }> = {
  hair: { depth: 9, z: -0.5 },
  head: { depth: 8, z: 0 },
  visor: { depth: 1.6, z: 4.4 },
  earcup: { depth: 6.5, z: -0.25 },
  boom: { depth: 2.5, z: 3.6 },
  neck: { depth: 5, z: -0.5 },
  torso: { depth: 6, z: -0.5 },
  arms: { depth: 4.5, z: -0.5 },
  badge: { depth: 6.4, z: -0.3 },
  legs: { depth: 5, z: -0.5 },
  shins: { depth: 4, z: -0.5 },
  feet: { depth: 7, z: 0.5 },
  overlay: { depth: 1, z: 3.56 },
  sweat: { depth: 1, z: 4.4 },
}

export const VOXEL_COLORS: Record<string, number> = {
  h: 0xa57d55,
  F: 0xcdc8c0,
  f: 0x8f806f,
  s: 0xd4d4d4,
  S: 0xa3a3a3,
  d: 0x808080,
  k: 0x000000,
  g: 0x25ed9e,
  l: 0x0e8c5e,
  G: 0xffffff,
  b: 0x8d7259,
  B: 0xcdc8c0,
  m: 0x2a2a2a,
  w: 0xf4f4f4,
  t: 0x0d0d0d,
  T: 0x262626,
  x: 0x25ed9e,
  p: 0xc4c4c4,
  r: 0xe6e6e6,
  q: 0xb43c3c,
  o: 0x59643a,
  O: 0x3f4729,
  n: 0x8a5a33,
}

export const LENS_COLORS: ReadonlySet<string> = new Set(['g', 'G', 'l'])

const VISOR_COLORS: ReadonlySet<string> = new Set(['k', 'g', 'G', 'l'])

const HAIR_COLORS: ReadonlySet<string> = new Set(['h', 'F', 'f'])

const SKIN_COLORS: ReadonlySet<string> = new Set(['s', 'S', 'd'])

export type Pixel = { x: number; y: number; c: string }

export function pixelsOf(grid: Grid): Pixel[] {
  const pixels: Pixel[] = []
  grid.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== EMPTY) pixels.push({ x: grid.x + x, y: grid.y + y, c: row[x]! })
  })
  return pixels
}

function rowsWith(grid: Grid, test: RegExp): number[] {
  return grid.rows.flatMap((row, index) => (test.test(row) ? [grid.y + index] : []))
}

function voxel(pixel: Pixel, part: VoxelPart): Voxel {
  return { ...pixel, part, ...VOXEL_DEPTH[part] }
}

const HEAD_PARTS: ReadonlySet<VoxelPart> = new Set(['hair', 'head', 'earcup', 'boom'])

export function isHeadPart(part: VoxelPart): boolean {
  return HEAD_PARTS.has(part) || part === 'visor' || part === 'overlay' || part === 'sweat'
}

export function buildVoxelModel(): VoxelModel {
  const firstTee = rowsWith(AVATAR_BODY, /t/)[0]!
  const lastTee = rowsWith(AVATAR_BODY, /[oO]/)[0]! - 1
  const neckRow = firstTee - 1
  const lens = rowsWith(AVATAR_BODY, /[gl]/).filter((row) => row < neckRow)
  const visorTop = lens[0]! - 1
  const visorBottom = lens.at(-1)! + 1
  const visorLeft = Math.min(...pixelsOf(AVATAR_BODY).filter((pixel) => pixel.y === visorTop && pixel.c === 'k').map((pixel) => pixel.x))

  const partOf = ({ x, y, c }: Pixel): VoxelPart => {
    if (y < neckRow) {
      if (c === 'p' || c === 'x') return x < visorLeft ? 'earcup' : 'boom'
      if (VISOR_COLORS.has(c) && y >= visorTop && y <= visorBottom && x >= visorLeft) return 'visor'
      return HAIR_COLORS.has(c) ? 'hair' : 'head'
    }
    if (y === neckRow) return 'neck'
    if (y <= lastTee) {
      if (c === 'x' || c === 'n') return 'badge'
      return SKIN_COLORS.has(c) ? 'arms' : 'torso'
    }
    if (c === 'k' || c === 'r') return 'feet'
    if (SKIN_COLORS.has(c)) return y === lastTee + 1 ? 'arms' : 'shins'
    return c === 'T' ? 'shins' : 'legs'
  }

  const all = pixelsOf(AVATAR_BODY).map((pixel) => voxel(pixel, partOf(pixel)))
  const still = all.filter((item) => !isHeadPart(item.part))
  const head = all.filter((item) => HEAD_PARTS.has(item.part))
  const visor = all.filter((item) => item.part === 'visor')
  const body = [...still, ...head, ...visor]

  const droppedLens = rowsWith(GLASSES_DOWN, /g/)[0]!
  const visorDrop = droppedLens - lens[0]!
  const eyes = pixelsOf(GLASSES_DOWN)
    .filter((pixel) => pixel.y < visorTop + visorDrop)
    .map((pixel) => voxel(pixel, 'overlay'))

  const mouths = Object.fromEntries(MOUTH_NAMES.map((name) => [name, pixelsOf(MOUTHS[name]).map((pixel) => voxel(pixel, 'overlay'))])) as Record<
    MouthName,
    Voxel[]
  >

  return {
    width: Math.max(...AVATAR_BODY.rows.map((row) => row.length)),
    height: AVATAR_BODY.rows.length,
    body,
    headStart: still.length,
    visorStart: still.length + head.length,
    mouths,
    eyes,
    sweat: pixelsOf(SWEAT).map((pixel) => voxel(pixel, 'sweat')),
    visorDrop,
    pivot: { x: Math.max(...AVATAR_BODY.rows.map((row) => row.length)) / 2, y: neckRow },
  }
}

export const VOXEL_MODEL: VoxelModel = buildVoxelModel()

export function voxelCount(model: VoxelModel): number {
  return model.body.length + MOUTH_NAMES.reduce((total, name) => total + model.mouths[name].length, 0) + model.eyes.length + model.sweat.length
}
