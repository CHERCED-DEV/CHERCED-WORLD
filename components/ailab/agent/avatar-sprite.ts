import { fillRuns, outlineRuns, type Grid, type Run } from '@/components/fun/sprite'

export const AVATAR_VIEWBOX = { x: -4, y: -7, width: 40, height: 57 } as const

export const AVATAR_COLORS = ['h', 'F', 'f', 's', 'S', 'd', 'k', 'g', 'l', 'G', 'b', 'B', 'm', 'w', 't', 'T', 'x', 'p', 'r', 'q'] as const

export const AVATAR_BODY: Grid = {
  x: 0,
  y: 0,
  rows: [
    '...........h...hh...h...........',
    '..........hh..hhhh..hh..........',
    '.......h.hhh.hhFFhh.hhh.h.......',
    '.......hhhFhFhhhhhhFhhhhh.......',
    '.....hhhhhhFhhhhhhhhFhhhhhh.....',
    '....hhhhhhhhhhhhhhhhhhhhhhhh....',
    '....FhhhhhhhhhhhhhhhhhhhhhhF....',
    '...FFfhhhhhhhhhhhhhhhhhhhhfFF...',
    '...FfssssssssssssssssssssssfF...',
    '...fssssssssssssssssssssssssf...',
    '..fssssssssssssssssssssssssssf..',
    '.ppkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    'pxpgGGgggggggggggggggggGggggggk.',
    'pxpggGggggggggggggggggggggggggk.',
    'pxplllllllllllllllllllllllllllk.',
    'pxpkkkkkkkkkkkkkkkkkkkkkkkkkkkd.',
    '.ppssssssssssSSSSSSsssssssssssd.',
    '.dpsssssssssssSddSssssssssssssd.',
    '..spbssssssssssssssssssssssbbs..',
    '..sbppssssssssssssssssssssbbbs..',
    '..sbBbppbbbbbbbbbbbbbbbbbbbBbs..',
    '..sbbbbbpxxbmmmmmmmmbbbbbbbbbs..',
    '...bbbbbbbbbmwwwwwwmbbbbbbbbb...',
    '...bBbbbbbbbbbmmmmbbbbbbbbbBb...',
    '....bbBbbbbbbbbbbbbbbbbbbBbb....',
    '.....bbbBbbbbbbbbbbbbbbBbbb.....',
    '.......bbbBBbbbbbbbbBBbbb.......',
    '..........bbbbbbbbbbbb..........',
    '..........ssssssssssss..........',
    '........tttttTssssTttttt........',
    '.....tttttttttTttTttttttttt.....',
    '....tttttttttttttttttttttttt....',
    '...tttttttttttttttttttttttttt...',
    '..sSttttttttttttttttttttttttSs..',
    '..sSttttttttttttttttttttttttSs..',
    '..sSttttttttttttttxxxtttttttSs..',
    '..sSttttttttttttttxtttttttttSs..',
    '..sSttttttttttttttxxxtttttttSs..',
    '..ssTttttttttttttttttttttttTss..',
    '..ssTTTTTTTTTTTTTTTTTTTTTTTTss..',
    '..ds.wwwwwwwwwwwwwwwwwwwwww.sd..',
    '.....wwwwwwwwwwppwwwwwwwwww.....',
    '.....wwwwwwwwwwppwwwwwwwwww.....',
    '.....wwwwwwwwww..wwwwwwwwww.....',
    '.....pwwwwwwwww..wwwwwwwwwp.....',
    '.....pwwwwwwwwp..pwwwwwwwwp.....',
    '....kkkkkkkkkk....kkkkkkkkkk....',
    '...kkkkkkkkkkk....kkkkkkkkkkk...',
    '...rrrrrrrrrrr....rrrrrrrrrrr...',
  ],
}

export const MOUTH_Y = 21

export const MOUTH_CLOSED: Grid = { x: 0, y: MOUTH_Y, rows: ['............bbbbbbbb............', '............bmmmmmmb............', '..............bbbb..............'] }

export const MOUTH_MID: Grid = { x: 0, y: MOUTH_Y, rows: ['............b......b............', '............bm....mb............', '................................'] }

export const MOUTH_OPEN: Grid = { x: 0, y: MOUTH_Y, rows: ['.............wwwwww.............', '.............mmmmmm.............', '.............mqqqqm.............'] }

export const GLASSES_DOWN: Grid = {
  x: 0,
  y: 10,
  rows: [
    '.......hh..............hh....sd.',
    '...sssssshhhhsssssshhhhsssssssd.',
    '...ssssswwwkksssssskkwwwssssssd.',
    '...ssssswwwkksssssskkwwwssssssd.',
    '...kkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '...ggGGggggggggggggggggGggggggk.',
    '...lllllllllllllllllllllllllllk.',
    '...kkkkkkkkkkkkkkkkkkkkkkkkkkk..',
  ],
}

export const SWEAT: Grid = { x: 25, y: 6, rows: ['.w.', 'www', 'www', '.w.'] }

export const MOUTHS = { closed: MOUTH_CLOSED, mid: MOUTH_MID, open: MOUTH_OPEN } as const

export type MouthName = keyof typeof MOUTHS

export const MOUTH_NAMES = Object.keys(MOUTHS) as MouthName[]

export const AVATAR_OUTLINE: readonly Run[] = outlineRuns(AVATAR_BODY)

export const AVATAR_FILL: readonly Run[] = fillRuns(AVATAR_BODY)

export const SWEAT_FILL: readonly Run[] = fillRuns(SWEAT)

export const GLASSES_DOWN_FILL: readonly Run[] = fillRuns(GLASSES_DOWN)

export const CROTCH = { left: 12, right: 20, top: 39, bottom: 45 } as const

export function isCrotch(x: number, y: number): boolean {
  return x >= CROTCH.left && x < CROTCH.right && y >= CROTCH.top && y < CROTCH.bottom
}

export const MOUTH_FILLS: ReadonlyArray<{ name: MouthName; runs: Run[] }> = MOUTH_NAMES.map((name) => ({ name, runs: fillRuns(MOUTHS[name]) }))

export function mouthFor(level: number): MouthName {
  if (level >= 0.14) return 'open'
  if (level >= 0.045) return 'mid'
  return 'closed'
}
