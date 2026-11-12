export type Run = { x: number; y: number; w: number; c: string }

export type Grid = { x: number; y: number; rows: readonly string[] }

export const EMPTY = '.'

export const SPRITE_COLORS = ['h', 'b', 'B', 'f', 's', 'S', 'k', 'g', 'G', 't', 'w', 'm'] as const

export type SpriteColor = (typeof SPRITE_COLORS)[number]

export const SPRITE_VIEWBOX = { x: 0, y: -5, width: 26, height: 33 } as const

export const SPRITE_SCALE = 3

const HEAD: Grid = {
  x: 1,
  y: 0,
  rows: [
    '.....hhhhhh.....',
    '...hhhhhhhhhh...',
    '..fhhhhhhhhhhf..',
    '.ffssssssssssff.',
    '.fshhhsssshhhsf.',
    'kkkkkkkkkkkkkkkk',
    'kgGgggggggggGggk',
    'kggGgggggggggGgk',
    '.kkkkkkSSkkkkkk.',
    'ssbssssSSssssbss',
    '.sbBssssssssBbs.',
    '.bbBbbbbbbbbBbb.',
    '.bBbbwwwwwwbbBb.',
    '..bbBbmmmmbBbb..',
    '...bBbbbbbbBb...',
    '.....bbBBbb.....',
  ],
}

const SPIKES: Grid = {
  x: 1,
  y: -4,
  rows: ['....h...h...h...', '...hh..hh..hh...', '...hhh.hhhh.hhh.', '...hhhhhhhhhhhh.'],
}

const TORSO: Grid = {
  x: 1,
  y: 16,
  rows: [
    '....tttttttt....',
    '..tttttttttttt..',
    '.tttttttttttttt.',
    'sSSttttwwtttt...',
    'sSSttttwttttt...',
    '.kktttttttttt...',
    '.sswwwwwwwwww...',
  ],
}

const CROSSED: Grid = {
  x: 1,
  y: 16,
  rows: [
    '....tttttttt....',
    '..tttttttttttt..',
    '.tttttttttttttt.',
    'sStsssssssssstSs',
    'sStSSSSSkkSSStSs',
    '.tttttttttttttt.',
    '...wwwwwwwwww...',
  ],
}

const ARM_DOWN: Grid = {
  x: 1,
  y: 16,
  rows: ['................', '................', '................', '.............SSs', '.............SSs', '.............ss.', '.............ss.'],
}

const ARM_POKE: Grid = {
  x: 1,
  y: 16,
  rows: ['........................', '........................', '........................', '.............SSssssss...', '.............SSsssssssss'],
}

const LEGS: Grid = { x: 1, y: 23, rows: ['...wwwwwwwwww...', '...wwww..wwww...', '...wwww..wwww...', '..kkkkk..kkkkk..'] }

const STEP: Grid = { x: 1, y: 23, rows: ['...wwwwwwwwww...', '..wwww....wwww..', '..www......www..', '.kkkk......kkkk.'] }

const SIT: Grid = { x: 1, y: 23, rows: ['...wwwwwwwwww...', '..wwwwwwwwwwww..', '.kkkkk....kkkkk.'] }

const SWEAT: Grid = { x: 18, y: 3, rows: ['.w.', 'www', 'www', '.w.'] }

export const POUT: Grid = { x: 1, y: 12, rows: ['.bBbbbmmmmbbbBb.', '..bbBbmbbmbBbb..'] }

export const YELL: Grid = { x: 1, y: 12, rows: ['.bBbmmmmmmmmbBb.', '..bbmwwwwwwmbb..', '...bbmmmmmmbb...'] }

export const TEAR: Grid = { x: 4, y: 9, rows: ['g', 'g'] }

export const PARTS = {
  legs: LEGS,
  step: STEP,
  sit: SIT,
  torso: TORSO,
  crossed: CROSSED,
  armDown: ARM_DOWN,
  armPoke: ARM_POKE,
  spikes: SPIKES,
  head: HEAD,
  sweat: SWEAT,
} as const

export type PartName = keyof typeof PARTS

export const PART_ORDER = Object.keys(PARTS) as PartName[]

export const OVERLAYS = { pout: POUT, yell: YELL, tear: TEAR } as const

export type OverlayName = keyof typeof OVERLAYS

function filled(rows: readonly string[], x: number, y: number): boolean {
  const row = rows[y]
  return row !== undefined && x >= 0 && x < row.length && row[x] !== EMPTY
}

function merge(cells: readonly { x: number; y: number; c: string }[]): Run[] {
  const runs: Run[] = []
  for (const cell of cells) {
    const last = runs.at(-1)
    if (last && last.y === cell.y && last.c === cell.c && last.x + last.w === cell.x) last.w += 1
    else runs.push({ x: cell.x, y: cell.y, w: 1, c: cell.c })
  }
  return runs
}

export function fillRuns(grid: Grid): Run[] {
  const cells: { x: number; y: number; c: string }[] = []
  grid.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== EMPTY) cells.push({ x: grid.x + x, y: grid.y + y, c: row[x]! })
  })
  return merge(cells)
}

export function outlineRuns(grid: Grid): Run[] {
  const width = Math.max(...grid.rows.map((row) => row.length))
  const cells: { x: number; y: number; c: string }[] = []
  for (let y = -1; y <= grid.rows.length; y++) {
    for (let x = -1; x <= width; x++) {
      if (filled(grid.rows, x, y)) continue
      let edge = false
      for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1 && !edge; dx++) edge = filled(grid.rows, x + dx, y + dy)
      if (edge) cells.push({ x: grid.x + x, y: grid.y + y, c: 'o' })
    }
  }
  return merge(cells)
}
